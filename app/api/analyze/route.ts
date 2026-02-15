import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabaseClient'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Khởi tạo Gemini client
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || ''
const genAI = new GoogleGenerativeAI(GEMINI_KEY)

// ============================================
// INTERFACE KẾT QUẢ PHÂN TÍCH AI
// ============================================
interface AnalysisResult {
  content_vi: string
  tags: string[]
  mindmap_code: string
  flashcards: { q: string; a: string }[]
  // 🆕 Enhanced fields
  implementation_suggestions?: {
    ideas: string[]
    tools: string[]
    challenges: string[]
    vn_context?: string
  }
  key_contributions?: string[]
}

// ============================================
// 🆕 CACHE THEO URL - LƯU KẾT QUẢ ĐÃ PHÂN TÍCH
// ============================================
interface SkippedEntry {
  title: string
  tags: string[]
  reason: string
  timestamp: number
}

// Cache cho các URL đã quét nhưng bị bỏ qua (không đủ tags, v.v.)
const skippedUrlCache = new Map<string, SkippedEntry>()
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7 // 7 ngày

function normalizeUrl(url: string): string {
  // Chuẩn hóa URL để so sánh
  try {
    const u = new URL(url)
    // Bỏ trailing slash và query params không cần thiết
    return `${u.protocol}//${u.host}${u.pathname}`.replace(/\/$/, '').toLowerCase()
  } catch {
    return url.toLowerCase().replace(/\/$/, '')
  }
}

function getSkippedFromCache(url: string): SkippedEntry | null {
  const key = normalizeUrl(url)
  const entry = skippedUrlCache.get(key)
  if (!entry) return null
  
  // Kiểm tra TTL
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    skippedUrlCache.delete(key)
    return null
  }
  
  return entry
}

function saveSkippedToCache(url: string, title: string, tags: string[], reason: string): void {
  const key = normalizeUrl(url)
  
  // Giới hạn cache size
  if (skippedUrlCache.size > 5000) {
    const entries = Array.from(skippedUrlCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    entries.slice(0, 500).forEach(([k]) => skippedUrlCache.delete(k))
  }
  
  skippedUrlCache.set(key, { title, tags, reason, timestamp: Date.now() })
  console.log(`💾 Đã cache URL bị bỏ qua. Cache size: ${skippedUrlCache.size}`)
}

// ============================================
// 🆕 KIỂM TRA URL ĐÃ CÓ TRONG DATABASE CHƯA
// ============================================
async function checkUrlInDatabase(url: string): Promise<{ exists: boolean; data?: { id: number; topic: string; tags: string[]; category: string } }> {
  if (!url) return { exists: false }
  
  const normalizedUrl = normalizeUrl(url)
  
  // Tìm trong database với cả URL gốc và URL đã chuẩn hóa
  const { data, error } = await supabase
    .from('documents')
    .select('id, topic, tags, category, url')
    .or(`url.eq.${url},url.ilike.%${normalizedUrl.split('//')[1] || url}%`)
    .limit(1)
  
  if (error || !data || data.length === 0) {
    return { exists: false }
  }
  
  return {
    exists: true,
    data: {
      id: data[0].id,
      topic: data[0].topic,
      tags: data[0].tags || [],
      category: data[0].category || 'General'
    }
  }
}

// ============================================
// 🆕 RETRY LOGIC VỚI EXPONENTIAL BACKOFF
// ============================================
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1) // 1s, 2s, 4s
        console.log(`⚠️ Lần thử ${attempt}/${maxRetries} thất bại. Thử lại sau ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

// ============================================
// HÀM TRÍCH XUẤT DOI TỪ URL
// ============================================
function extractDOI(url: string): string | null {
  // Patterns cho DOI
  // https://doi.org/10.1016/j.aei.2024.102890
  // https://dx.doi.org/10.1016/j.aei.2024.102890
  // 10.1016/j.aei.2024.102890
  const patterns = [
    /doi\.org\/(.+)$/i,
    /dx\.doi\.org\/(.+)$/i,
    /^(10\.\d{4,}\/[^\s]+)$/i
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// ============================================
// HÀM LẤY METADATA TỪ CROSSREF API (MIỄN PHÍ)
// ============================================
interface CrossRefWork {
  title?: string[]
  abstract?: string
  author?: { given?: string; family?: string }[]
  subject?: string[]
  'container-title'?: string[]
  published?: { 'date-parts'?: number[][] }
  DOI?: string
}

async function fetchDOIMetadata(doi: string): Promise<{ title: string; content: string; url: string } | null> {
  try {
    const apiUrl = `https://api.crossref.org/works/${encodeURIComponent(doi)}`
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'MindTrans-AI/1.0 (mailto:contact@mindtrans.ai)'
      }
    })
    
    if (!res.ok) {
      console.error(`CrossRef API error: ${res.status}`)
      return null
    }
    
    const data = await res.json()
    const work: CrossRefWork = data.message
    
    // Lấy title
    const title = work.title?.[0] || 'Untitled'
    
    // Lấy abstract (nếu có)
    let abstract = work.abstract || ''
    // Loại bỏ HTML tags trong abstract
    abstract = abstract.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    
    // Lấy authors
    const authors = work.author?.map(a => `${a.given || ''} ${a.family || ''}`.trim()).join(', ') || ''
    
    // Lấy journal name
    const journal = work['container-title']?.[0] || ''
    
    // Lấy năm xuất bản
    const year = work.published?.['date-parts']?.[0]?.[0] || ''
    
    // Lấy subjects/keywords
    const subjects = work.subject?.join(', ') || ''
    
    // Tổng hợp content
    const content = `
Title: ${title}
Authors: ${authors}
Journal: ${journal}
Year: ${year}
Keywords: ${subjects}
Abstract: ${abstract}
DOI: ${doi}
    `.trim()
    
    return {
      title,
      content,
      url: `https://doi.org/${doi}`
    }
  } catch (err) {
    console.error('CrossRef fetch error:', err)
    return null
  }
}

// ============================================
// HÀM TRÍCH XUẤT TEXT TỪ HTML
// ============================================
function extractTextFromHTML(html: string) {
  const cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
  return cleaned.replace(/\s+/g, ' ').trim()
}

// ============================================
// HÀM TRÍCH XUẤT TAGS TỪ TITLE (FALLBACK) - MỞ RỘNG
// ============================================
function extractTagsFromTitle(title: string): string[] {
  const keywords: Record<string, string[]> = {
    // AI & Machine Learning (mở rộng)
    'AI': ['ai', 'artificial intelligence', 'intelligent', 'smart', 'adaptive', 'cognitive', 'expert system'],
    'Machine Learning': ['machine learning', 'ml', 'supervised', 'unsupervised', 'classification', 'regression', 'prediction', 'predictive', 'model', 'modeling', 'learning-based', 'training', 'inference', 'feature extraction', 'feature learning', 'ensemble', 'random forest', 'svm', 'support vector', 'decision tree', 'xgboost', 'boosting', 'bagging'],
    'Deep Learning': ['deep learning', 'cnn', 'rnn', 'lstm', 'gru', 'autoencoder', 'gan', 'generative', 'neural network', 'convolutional', 'recurrent', 'encoder', 'decoder', 'attention', 'transformer', 'bert', 'gpt', 'resnet', 'vgg', 'unet', 'yolo', 'faster rcnn', 'mask rcnn', 'diffusion', 'variational'],
    'Reinforcement Learning': ['reinforcement learning', 'rl', 'q-learning', 'policy gradient', 'actor-critic', 'reward', 'agent', 'multi-agent'],
    'Transfer Learning': ['transfer learning', 'domain adaptation', 'fine-tuning', 'pretrained', 'pre-trained', 'meta-learning', 'few-shot', 'zero-shot'],
    
    // Digital & Smart Technologies (mở rộng)
    'Digital Twin': ['digital twin', 'virtual model', 'simulation', 'digital replica', 'cyber-physical', 'virtual prototype'],
    'IoT': ['iot', 'internet of things', 'sensor', 'smart device', 'edge computing', 'wireless sensor', 'monitoring', 'embedded', 'wearable', 'rfid', 'mqtt', 'zigbee', 'lora'],
    'Automation': ['automation', 'automated', 'autonomous', 'automatic', 'self-driving', 'unmanned', 'agv', 'amr'],
    'AR/VR': ['augmented reality', 'virtual reality', 'extended reality', 'mixed reality', 'ar', 'vr', 'xr', 'metaverse', 'holographic', 'immersive'],
    'Cloud Computing': ['cloud', 'aws', 'azure', 'gcp', 'serverless', 'microservice', 'kubernetes', 'docker', 'distributed computing'],
    
    // Engineering & Industry (mở rộng)
    'Engineering': ['engineering', 'structural', 'mechanical', 'civil', 'industrial', 'aerospace', 'aviation', 'thermal', 'fluid', 'material', 'composite'],
    'Fault Diagnosis': ['fault diagnosis', 'fault detection', 'anomaly detection', 'defect', 'failure', 'bearing', 'machinery', 'rotating', 'vibration', 'condition monitoring', 'health monitoring', 'prognostic', 'phm', 'remaining useful life', 'rul', 'degradation', 'wear', 'crack', 'imbalanced'],
    'Construction': ['construction', 'building', 'bim', 'architecture', 'infrastructure', 'concrete', 'bridge', 'dam', 'demolition', 'renovation', 'prefabricated', 'modular', 'scaffolding', 'excavation'],
    'Manufacturing': ['manufacturing', 'production', 'factory', 'industry 4.0', 'smart factory', 'assembly', 'machining', 'gear', 'turbine', 'cnc', 'additive manufacturing', '3d printing', 'welding', 'casting', 'forging', 'milling', 'turning', 'quality control', 'spc'],
    
    // Computer Science (mở rộng)
    'Computer Vision': ['computer vision', 'image', 'visual', 'object detection', 'segmentation', '3d point cloud', 'recognition', 'identification', 'contour', 'keypoint', 'pose estimation', 'face', 'ocr', 'scene understanding', 'depth estimation', 'stereo', 'lidar', 'slam', 'optical flow'],
    'NLP': ['nlp', 'natural language', 'text', 'language model', 'semantic', 'word embedding', 'sentiment', 'named entity', 'question answering', 'summarization', 'translation', 'chatbot', 'dialogue', 'speech'],
    'Robotics': ['robot', 'robotic', 'drone', 'uav', 'autonomous vehicle', 'navigation', 'path planning', 'manipulation', 'gripper', 'humanoid', 'mobile robot', 'swarm', 'ros'],
    'Graph Neural Network': ['graph neural', 'gnn', 'gcn', 'knowledge graph', 'graph attention', 'spatial-temporal graph', 'graph learning', 'node embedding', 'link prediction', 'graph transformer'],
    'Signal Processing': ['signal processing', 'fft', 'wavelet', 'fourier', 'frequency', 'time-frequency', 'spectrogram', 'filtering', 'denoising', 'compressed sensing'],
    
    // Data & Analytics (mở rộng)
    'Data Science': ['data', 'analytics', 'big data', 'data mining', 'statistics', 'dataset', 'imbalanced', 'semi-supervised', 'label', 'annotation', 'data augmentation', 'data pipeline', 'etl', 'warehouse', 'lakehouse'],
    'Optimization': ['optimization', 'optimal', 'multi-objective', 'genetic algorithm', 'metaheuristic', 'scheduling', 'planning', 'evolutionary', 'particle swarm', 'pso', 'ant colony', 'simulated annealing', 'bayesian optimization', 'linear programming', 'constraint'],
    'Time Series': ['time series', 'forecasting', 'temporal', 'sequential', 'trend', 'seasonality', 'arima', 'prophet'],
    
    // Domain-specific (mở rộng)
    'Healthcare': ['health', 'medical', 'clinical', 'patient', 'disease', 'diagnosis', 'treatment', 'hospital', 'radiology', 'pathology', 'ecg', 'eeg', 'mri', 'ct scan', 'x-ray', 'ultrasound', 'genomics', 'drug', 'pharmaceutical'],
    'Energy': ['energy', 'power', 'electricity', 'renewable', 'solar', 'wind', 'battery', 'grid', 'smart grid', 'photovoltaic', 'hydropower', 'nuclear', 'fossil', 'carbon', 'emission', 'sustainability'],
    'Transportation': ['vehicle', 'traffic', 'transportation', 'railway', 'road', 'axle', 'load', 'logistics', 'fleet', 'routing', 'shipping', 'freight', 'autonomous driving', 'adas', 'connected vehicle', 'v2x'],
    'Safety': ['safety', 'hazard', 'risk', 'accident', 'inspection', 'quality', 'compliance', 'reliability', 'resilience', 'emergency'],
    'Agriculture': ['agriculture', 'farming', 'crop', 'soil', 'irrigation', 'precision agriculture', 'livestock', 'greenhouse', 'harvest'],
    'Environment': ['environment', 'climate', 'weather', 'pollution', 'air quality', 'water quality', 'ecosystem', 'biodiversity', 'remote sensing', 'satellite'],
    'Finance': ['finance', 'banking', 'trading', 'stock', 'cryptocurrency', 'fraud detection', 'credit', 'risk management', 'fintech'],
    
    // Security & Blockchain (mở rộng)
    'Blockchain': ['blockchain', 'distributed ledger', 'smart contract', 'cryptocurrency', 'bitcoin', 'ethereum', 'nft', 'defi', 'consensus', 'web3'],
    'Cybersecurity': ['security', 'cyber', 'encryption', 'privacy', 'attack', 'intrusion', 'malware', 'ransomware', 'phishing', 'authentication', 'authorization', 'firewall', 'ids', 'ips', 'penetration testing'],
    
    // Emerging Technologies
    'Quantum Computing': ['quantum', 'qubit', 'quantum machine learning', 'quantum algorithm'],
    '5G/6G': ['5g', '6g', 'wireless', 'mobile network', 'mmwave', 'massive mimo', 'beamforming'],
    'Edge AI': ['edge ai', 'tinyml', 'on-device', 'embedded ai', 'neural accelerator', 'npu', 'model compression', 'quantization', 'pruning', 'knowledge distillation']
  }

  const titleLower = title.toLowerCase()
  const foundTags: string[] = []

  for (const [tag, patterns] of Object.entries(keywords)) {
    for (const pattern of patterns) {
      if (titleLower.includes(pattern)) {
        foundTags.push(tag)
        break
      }
    }
  }

  return foundTags.slice(0, 5)
}

// ============================================
// HÀM XÁC ĐỊNH CATEGORY TỪ TAGS
// ============================================
function determineCategory(tags: string[]): string {
  const categoryMapping: Record<string, string[]> = {
    'Artificial Intelligence': ['AI', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision'],
    'Engineering & Manufacturing': ['Engineering', 'Manufacturing', 'Fault Diagnosis', 'Automation'],
    'Construction & Architecture': ['Construction', 'AR/VR', 'Digital Twin'],
    'Data & Analytics': ['Data Science', 'Graph Neural Network', 'Optimization'],
    'IoT & Smart Systems': ['IoT', 'Robotics', 'Automation'],
    'Healthcare': ['Healthcare'],
    'Energy & Environment': ['Energy'],
    'Transportation': ['Transportation'],
    'Security': ['Cybersecurity', 'Blockchain', 'Safety']
  }

  for (const [category, categoryTags] of Object.entries(categoryMapping)) {
    for (const tag of tags) {
      if (categoryTags.includes(tag)) {
        return category
      }
    }
  }

  return 'General'
}

// ============================================
// HÀM TẠO MINDMAP ĐƠN GIẢN TỪ TITLE VÀ TAGS
// ============================================
function generateSimpleMindmap(title: string, tags: string[]): string {
  if (tags.length === 0) return ''
  
  const mainNode = title.length > 50 ? title.slice(0, 47) + '...' : title
  const tagNodes = tags.slice(0, 5).map((tag, i) => `    A --> B${i}[${tag}]`).join('\n')
  
  return `graph TD
    A["${mainNode.replace(/"/g, "'")}"]
${tagNodes}`
}

// ============================================
// HÀM TẠO FLASHCARDS ĐƠN GIẢN TỪ TITLE
// ============================================
function generateSimpleFlashcards(title: string, tags: string[]): { q: string; a: string }[] {
  const flashcards: { q: string; a: string }[] = []
  
  flashcards.push({
    q: `Bài báo "${title.slice(0, 100)}" nghiên cứu về chủ đề gì?`,
    a: `Bài báo nghiên cứu về các chủ đề: ${tags.join(', ')}`
  })
  
  if (tags.length > 0) {
    flashcards.push({
      q: `${tags[0]} là gì và ứng dụng trong nghiên cứu này như thế nào?`,
      a: `${tags[0]} là một lĩnh vực quan trọng được áp dụng trong bài báo này để giải quyết vấn đề nghiên cứu.`
    })
  }
  
  if (tags.length > 1) {
    flashcards.push({
      q: `Mối quan hệ giữa ${tags[0]} và ${tags[1]} trong bài báo này?`,
      a: `Hai lĩnh vực này được kết hợp để tạo ra giải pháp toàn diện cho vấn đề nghiên cứu.`
    })
  }
  
  return flashcards
}

// ============================================
// HÀM GỌI GEMINI AI ĐỂ PHÂN TÍCH BÀI BÁO (VỚI RETRY)
// ============================================
async function analyzeWithAI(title: string, content: string): Promise<AnalysisResult> {
  // Luôn tạo fallback trước
  const fallbackTags = extractTagsFromTitle(title)
  const fallbackMindmap = generateSimpleMindmap(title, fallbackTags)
  const fallbackFlashcards = generateSimpleFlashcards(title, fallbackTags)
  
  if (!GEMINI_KEY) {
    console.error('❌ GEMINI_API_KEY không được cấu hình! Dùng fallback.')
    return {
      content_vi: `Bài báo: "${title}"\n\n${content.slice(0, 1500)}`,
      tags: fallbackTags,
      mindmap_code: fallbackMindmap,
      flashcards: fallbackFlashcards
    }
  }

  const prompt = `
Bạn là chuyên gia phân tích bài báo khoa học. Hãy phân tích bài báo sau:

TIÊU ĐỀ: ${title}
NỘI DUNG: ${content.slice(0, 8000)}

BẮT BUỘC thực hiện các nhiệm vụ sau:

1. **TÓM TẮT TIẾNG VIỆT** (200-300 từ):
   - Tóm tắt nội dung chính của bài báo
   - Nêu rõ vấn đề nghiên cứu, phương pháp, và kết quả
   - Dễ hiểu cho sinh viên Việt Nam

2. **TAGS** (3-6 tags):
   - Trích xuất các từ khóa tiếng Anh ngắn gọn
   - Ví dụ: "AI", "Machine Learning", "Deep Learning", "Digital Twin", "IoT", "Computer Vision", etc.

3. **MINDMAP** (MermaidJS):
   - Tạo sơ đồ tư duy dạng graph TD
   - Thể hiện cấu trúc chủ đề và mối quan hệ

4. **FLASHCARDS** (3 câu hỏi):
   - Câu hỏi ôn tập nội dung quan trọng

5. **🆕 GỢI Ý TRIỂN KHAI CHO SINH VIÊN VIỆT NAM**:
   - ideas: 2-3 ý tưởng áp dụng nghiên cứu này vào thực tế VN
   - tools: Các công cụ/framework/thư viện cần thiết
   - challenges: Thách thức khi triển khai và cách giải quyết
   - vn_context: Bối cảnh áp dụng phù hợp với Việt Nam (1-2 câu)

6. **🆕 ĐÓNG GÓP CHÍNH** (key_contributions):
   - 2-3 điểm đóng góp/phát hiện quan trọng của bài báo

CHỈ trả về JSON hợp lệ (KHÔNG có text khác):
{
    "content_vi": "Tóm tắt tiếng Việt chi tiết...",
    "tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"], 
    "mindmap_code": "graph TD; A[Main Topic] --> B[Sub1]; A --> C[Sub2]",
    "flashcards": [{"q": "Câu hỏi 1?", "a": "Trả lời 1"}, {"q": "Câu hỏi 2?", "a": "Trả lời 2"}, {"q": "Câu hỏi 3?", "a": "Trả lời 3"}],
    "implementation_suggestions": {
        "ideas": ["Ý tưởng 1: Áp dụng vào...", "Ý tưởng 2: Phát triển..."],
        "tools": ["Python", "TensorFlow/PyTorch", "Tool khác..."],
        "challenges": ["Thách thức 1 + cách giải quyết", "Thách thức 2..."],
        "vn_context": "Nghiên cứu này có thể áp dụng vào lĩnh vực X tại VN vì..."
    },
    "key_contributions": ["Đóng góp 1", "Đóng góp 2", "Đóng góp 3"]
}
`

  try {
    // 🆕 Sử dụng retry logic với exponential backoff
    const result = await retryWithBackoff(async () => {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      return await model.generateContent(prompt)
    }, 3, 1000)
    
    const text = result.response.text()
    
    console.log('🤖 Gemini raw response (first 500 chars):', text.slice(0, 500))
    
    // Loại bỏ markdown code block nếu có
    const jsonStr = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()
    const parsed = JSON.parse(jsonStr) as AnalysisResult
    
    // Lấy tags từ AI hoặc fallback từ title
    let tags = Array.isArray(parsed.tags) && parsed.tags.length > 0 ? parsed.tags : fallbackTags
    
    // Đảm bảo có mindmap và flashcards
    const mindmap_code = parsed.mindmap_code || fallbackMindmap
    const flashcards = Array.isArray(parsed.flashcards) && parsed.flashcards.length > 0 
      ? parsed.flashcards 
      : fallbackFlashcards
    
    console.log(`✅ Phân tích thành công: ${tags.length} tags, mindmap: ${mindmap_code ? 'có' : 'không'}, flashcards: ${flashcards.length}`)
    
    return {
      content_vi: parsed.content_vi || `Bài báo: "${title}"`,
      tags,
      mindmap_code,
      flashcards,
      // 🆕 Enhanced fields
      implementation_suggestions: parsed.implementation_suggestions || undefined,
      key_contributions: parsed.key_contributions || undefined,
    }
  } catch (err) {
    console.error('❌ Gemini AI error (sau 3 lần retry):', err)
    console.log(`🔄 Dùng fallback - Tags: ${fallbackTags.join(', ')}`)
    
    return {
      content_vi: `Bài báo: "${title}"\n\n${content.slice(0, 1500)}`,
      tags: fallbackTags,
      mindmap_code: fallbackMindmap,
      flashcards: fallbackFlashcards
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { url, text, title } = body || {}

    let content = text
    let pageTitle = title || null
    let finalUrl = url

    // ============================================
    // 🆕 BƯỚC 1: Kiểm tra URL đã có trong DATABASE chưa
    // ============================================
    if (url) {
      const dbCheck = await checkUrlInDatabase(url)
      if (dbCheck.exists && dbCheck.data) {
        console.log(`📚 URL đã có trong database: ${dbCheck.data.topic}`)
        return NextResponse.json({
          saved: false,
          alreadyInDatabase: true,
          reason: 'already_in_database',
          message: 'URL này đã được phân tích và lưu trong database trước đó',
          existingData: {
            id: dbCheck.data.id,
            title: dbCheck.data.topic,
            tags: dbCheck.data.tags,
            category: dbCheck.data.category
          }
        })
      }
    }

    // ============================================
    // 🆕 BƯỚC 2: Kiểm tra URL đã bị bỏ qua trước đó chưa
    // ============================================
    if (url) {
      const skipped = getSkippedFromCache(url)
      if (skipped) {
        console.log(`⏭️ URL đã từng bị bỏ qua: ${skipped.title}`)
        return NextResponse.json({
          saved: false,
          previouslySkipped: true,
          reason: skipped.reason,
          message: `URL này đã từng được phân tích nhưng không lưu vì: ${skipped.reason}`,
          previousData: {
            title: skipped.title,
            tags: skipped.tags
          }
        })
      }
    }

    // ============================================
    // BƯỚC 3: Fetch content từ URL (nếu chưa có)
    // ============================================
    if (url && !content) {
      // Kiểm tra xem có phải link DOI không
      const doi = extractDOI(url)
      
      if (doi) {
        // Sử dụng CrossRef API để lấy metadata
        console.log(`📚 Đang lấy metadata từ DOI: ${doi}`)
        const doiData = await fetchDOIMetadata(doi)
        
        if (doiData) {
          content = doiData.content
          pageTitle = doiData.title
          finalUrl = doiData.url
          console.log(`✅ Đã lấy được metadata: ${pageTitle}`)
        } else {
          return NextResponse.json({ error: 'Không thể lấy metadata từ DOI. DOI có thể không tồn tại.' }, { status: 400 })
        }
      } else {
        // Fetch thông thường cho các URL khác
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        if (!res.ok) return NextResponse.json({ error: 'Failed to fetch url' }, { status: 400 })
        const html = await res.text()
        content = extractTextFromHTML(html)
        const m = html.match(/<title>([^<]+)<\/title>/i)
        if (m) pageTitle = m[1]
      }
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'No content to analyze' }, { status: 400 })
    }

    // ============================================
    // BƯỚC 4: Gọi Gemini AI để phân tích
    // ============================================
    const analysis = await analyzeWithAI(pageTitle || 'Untitled', content)

    if (analysis.tags.length >= 2) {
      // Xác định category từ tags
      const category = determineCategory(analysis.tags)
      
      const payload = {
        topic: pageTitle || (analysis.tags[0] || 'Untitled'),
        content_vi: analysis.content_vi,
        mindmap_code: analysis.mindmap_code,
        flashcards: analysis.flashcards,
        tags: analysis.tags,
        category: category,
        url: finalUrl || null
      }

      const { data, error } = await supabase.from('documents').insert(payload).select()
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ saved: true, tags: analysis.tags, category, id: data?.[0]?.id ?? null, title: pageTitle })
    } else {
      // 🆕 LƯU VÀO CACHE KHI BỎ QUA
      const skipReason = analysis.tags.length === 0 
        ? 'không tìm thấy tags nào' 
        : `chỉ có ${analysis.tags.length} tag (cần tối thiểu 2)`
      
      if (finalUrl) {
        saveSkippedToCache(finalUrl, pageTitle || 'Untitled', analysis.tags, skipReason)
      }
      
      return NextResponse.json({ 
        saved: false, 
        reason: 'not_enough_tags', 
        message: `Không lưu vào database vì ${skipReason}`,
        tags: analysis.tags, 
        title: pageTitle 
      })
    }

  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 })
  }
}
