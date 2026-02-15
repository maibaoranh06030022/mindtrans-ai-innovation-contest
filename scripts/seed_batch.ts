/**
 * =======================================================
 * SEED BATCH - Thêm nhiều bài báo vào Supabase
 * =======================================================
 *
 * Cách dùng:
 *   1. Thêm link vào mảng SEED_URLS bên dưới
 *   2. Chạy: npx ts-node scripts/seed_batch.ts
 *
 * Hoặc chạy với tsx (nhanh hơn):
 *   npx tsx scripts/seed_batch.ts
 */

// =======================================================
// CẤU HÌNH
// =======================================================

// URL của API analyze (đổi nếu deploy lên server khác)
const API_URL = process.env.API_URL || "http://localhost:3000/api/analyze";

// Thời gian chờ giữa các request (ms) - tránh rate limit
const DELAY_MS = 5000;

// =======================================================
// DANH SÁCH LINK BÀI BÁO CẦN SEED
// =======================================================
const SEED_URLS: string[] = [
  // // ===== REACT / FRONTEND =====
  // "https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components",
  // "https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components",
  // "https://react.dev/blog/2025/10/16/react-conf-2025-recap",
  // "https://react.dev/blog/2025/02/14/sunsetting-create-react-app",
  // // ===== AI / MACHINE LEARNING =====
  // "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai", // The state of AI in 2025
  // "https://unctad.org/publication/technology-and-innovation-report-2025", // Technology and Innovation Report 2025 - UNCTAD
  // "https://www.mdpi.com/2079-9292/14/4/800", // Trends and Applications of AI in Project Management (2025)
  // "https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2024.1438715/full", // Research trends in AI in higher education
  // "https://www.ibm.com/think/topics/artificial-intelligence", // AI Trends and Future Outlook - IBM 2025
  // "https://www.eimt.edu.eu/10-ai-and-machine-learning-trends-to-watch-in-2025", // 10 AI and ML Trends to Watch in 2025
  //   // ===== RESEARCH / SCIENCE =====
  // "https://www.esa-automation.com/en/artificial-intelligence-key-trends-and-areas-of-development-in-2025/", // AI Development Areas in Industrial Automation 2025
  // ===== THÊM LINK MỚI BÊN DƯỚI =====
  // "https://doi.org/10.1016/j.aei.2024.102890", // Title: Large language models for automated construction workflows and semantic enrichment of BIM | Year: 2025
  // "https://doi.org/10.1016/j.aei.2024.102925", // Title: Technology convergence prediction integrating GCN-based link prediction and semantic analysis | Year: 2025
  // "https://doi.org/10.1016/j.aei.2024.102912", // Title: SNESNet: A spectral-temporal attention network for adaptive health monitoring of rotating machinery | Year: 2025
  // "https://doi.org/10.1016/j.aei.2024.102901", // Title: Adaptive Single-source Open Domain Generalization Network for industrial fault diagnosis | Year: 2025
  // "https://doi.org/10.1016/j.aei.2024.102934", // Title: Knowledge graph-driven framework for sustainable manufacturing and circular economy | Year: 2025
  // "https://doi.org/10.1016/j.aei.2024.102711", // Title: Digital Twin industrialization: Towards a systematic framework for deployment | Year: 2025
  // "https://doi.org/10.1016/j.aei.2024.102845", // Title: Metaverse-based Digital Twin models for human-centric urban planning | Year: 2025
  // "https://doi.org/10.1016/j.aei.2024.102833", // Title: Explainable AI (XAI) for Digital Twin-driven complex engineering systems | Year: 2024
  // "https://doi.org/10.1016/j.aei.2024.102798", // Title: Blockchain-based Digital Twins for secure information exchange in AEC industry | Year: 2024
  // "https://doi.org/10.1016/j.aei.2024.102755", // Title: Multi-agent framework for autonomous drone-based visual inspection | Year: 2024
  // "https://doi.org/10.1016/j.aei.2024.102810", // Title: Industrializing Digital Twins: A design science research perspective | Year: 2024
  // "https://doi.org/10.1016/j.aei.2024.102779", // Title: 3D point cloud semantic segmentation for automated construction site monitoring | Year: 2024
  // "https://doi.org/10.1016/j.aei.2024.102744", // Title: Cyber-physical systems integration for smart factory performance optimization | Year: 2024
  // "https://doi.org/10.1016/j.aei.2024.102732", // Title: Reinforcement learning for autonomous robotics in structural engineering tasks | Year: 2024
  // "https://doi.org/10.1016/j.aei.2024.102712", // Title: Human-AI collaboration in transdisciplinary engineering design processes | Year: 2024
  // "https://doi.org/10.1016/j.aei.2024.102688", // Title: Energy-efficient smart building control using deep reinforcement learning models | Year: 2024
  // "https://doi.org/10.1016/j.aei.2024.102634", // Title: Graph Neural Networks for real-time structural health monitoring | Year: 2024
  // "https://doi.org/10.1016/j.aei.2024.102612", // Title: Multi-objective optimization in cyber-physical production environments | Year: 2024
  // "https://doi.org/10.1016/j.aei.2024.102601", // Title: Predictive maintenance using multimodal data fusion and transformer architectures | Year: 2024
  // "https://doi.org/10.1016/j.aei.2024.102667", // Title: Semantic web technologies for enhanced interoperability in Industry 5.0 | Year: 2024
  // --- LĨNH VỰC EMBEDDED SYSTEMS & EDGE AI ---
  // "https://doi.org/10.1016/j.iot.2024.101122", // Security Architectures for Embedded IoT Devices in 2025 | 2025
];

// =======================================================
// HÀM TIỆN ÍCH
// =======================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface AnalyzeResponse {
  saved?: boolean;
  tags?: string[];
  category?: string;
  id?: number;
  reason?: string;
  message?: string;
  error?: string;
  title?: string;
  // 🆕 Trường mới cho cache
  alreadyInDatabase?: boolean;
  previouslySkipped?: boolean;
  existingData?: {
    id: number;
    title: string;
    tags: string[];
    category: string;
  };
  previousData?: {
    title: string;
    tags: string[];
  };
}

async function analyzeUrl(url: string): Promise<AnalyzeResponse> {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    return (await res.json()) as AnalyzeResponse;
  } catch (err: any) {
    return { error: err?.message || String(err) };
  }
}

// =======================================================
// CHẠY CHÍNH
// =======================================================

async function main() {
  console.log("🚀 BẮT ĐẦU SEED BATCH");
  console.log(`📡 API: ${API_URL}`);
  console.log(`📄 Tổng số link: ${SEED_URLS.length}`);
  console.log("─".repeat(50));

  let saved = 0;
  let skipped = 0;
  let failed = 0;
  let alreadyExists = 0;
  let previouslySkipped = 0;

  for (let i = 0; i < SEED_URLS.length; i++) {
    const url = SEED_URLS[i];
    const index = i + 1;

    console.log(`\n[${index}/${SEED_URLS.length}] 🔍 Đang phân tích:`);
    console.log(`   ${url}`);

    const result = await analyzeUrl(url);

    if (result.error) {
      console.log(`   ❌ LỖI: ${result.error}`);
      failed++;
    } else if (result.alreadyInDatabase && result.existingData) {
      // 🆕 Link đã có trong database
      console.log(`   📚 ĐÃ CÓ TRONG DATABASE: "${result.existingData.title}"`);
      console.log(`      ID: ${result.existingData.id}`);
      console.log(`      Category: ${result.existingData.category}`);
      console.log(`      Tags: ${result.existingData.tags?.join(", ")}`);
      alreadyExists++;
    } else if (result.previouslySkipped && result.previousData) {
      // 🆕 Link đã từng bị bỏ qua
      console.log(`   ⏭️ ĐÃ TỪNG PHÂN TÍCH: "${result.previousData.title}"`);
      console.log(`      Không lưu vào DB vì: ${result.reason}`);
      console.log(
        `      Tags lúc đó: ${result.previousData.tags?.join(", ") || "none"}`,
      );
      previouslySkipped++;
    } else if (result.saved) {
      console.log(`   ✅ ĐÃ LƯU MỚI: "${result.title || "Untitled"}"`);
      console.log(`      Category: ${result.category || "General"}`);
      console.log(`      Tags: ${result.tags?.join(", ")}`);
      saved++;
    } else {
      console.log(`   🚫 BỎ QUA (MỚI): "${result.title || "Untitled"}"`);
      console.log(
        `      Lý do: ${result.message || result.reason || "Không đủ tags"}`,
      );
      console.log(`      Tags: ${result.tags?.join(", ") || "none"}`);
      skipped++;
    }

    // Chờ giữa các request (trừ request cuối)
    if (i < SEED_URLS.length - 1) {
      console.log(`   ⏳ Chờ ${DELAY_MS / 1000}s...`);
      await sleep(DELAY_MS);
    }
  }

  // Tổng kết
  console.log("\n" + "═".repeat(50));
  console.log("📊 KẾT QUẢ SEED BATCH");
  console.log("═".repeat(50));
  console.log(`   ✅ Đã lưu mới:     ${saved}`);
  console.log(`   📚 Đã có trong DB: ${alreadyExists}`);
  console.log(`   ⏭️ Đã từng quét:   ${previouslySkipped}`);
  console.log(`   🚫 Bỏ qua mới:     ${skipped}`);
  console.log(`   ❌ Lỗi:            ${failed}`);
  console.log(`   📄 Tổng:           ${SEED_URLS.length}`);
  console.log("═".repeat(50));
}

// Chạy
main().catch(console.error);
