/**
 * =======================================================
 * IT/AI/ENGINEERING GLOSSARY - Từ điển thuật ngữ chuyên ngành
 * =======================================================
 * 
 * Bảng thuật ngữ này được sử dụng trong Agentic Workflow:
 * - Prompt 1 (Translator): Dịch dựa trên glossary
 * - Prompt 2 (Tech Reviewer): Kiểm tra thuật ngữ đã đúng chưa
 */

export interface GlossaryEntry {
  en: string;           // Thuật ngữ tiếng Anh
  vi: string;           // Bản dịch tiếng Việt chuẩn
  definition?: string;  // Định nghĩa (tùy chọn)
  category: string;     // Lĩnh vực
}

export const IT_GLOSSARY: GlossaryEntry[] = [
  // ===== ARTIFICIAL INTELLIGENCE =====
  { en: "Artificial Intelligence", vi: "Trí tuệ nhân tạo", category: "AI" },
  { en: "Machine Learning", vi: "Học máy", category: "AI" },
  { en: "Deep Learning", vi: "Học sâu", category: "AI" },
  { en: "Neural Network", vi: "Mạng nơ-ron", category: "AI" },
  { en: "Convolutional Neural Network", vi: "Mạng nơ-ron tích chập (CNN)", category: "AI" },
  { en: "Recurrent Neural Network", vi: "Mạng nơ-ron hồi quy (RNN)", category: "AI" },
  { en: "Transformer", vi: "Transformer (kiến trúc biến đổi)", category: "AI" },
  { en: "Large Language Model", vi: "Mô hình ngôn ngữ lớn (LLM)", category: "AI" },
  { en: "Generative AI", vi: "AI tạo sinh", category: "AI" },
  { en: "Natural Language Processing", vi: "Xử lý ngôn ngữ tự nhiên (NLP)", category: "AI" },
  { en: "Computer Vision", vi: "Thị giác máy tính", category: "AI" },
  { en: "Reinforcement Learning", vi: "Học tăng cường", category: "AI" },
  { en: "Supervised Learning", vi: "Học có giám sát", category: "AI" },
  { en: "Unsupervised Learning", vi: "Học không giám sát", category: "AI" },
  { en: "Transfer Learning", vi: "Học chuyển giao", category: "AI" },
  { en: "Fine-tuning", vi: "Tinh chỉnh", category: "AI" },
  { en: "Prompt Engineering", vi: "Kỹ thuật thiết kế prompt", category: "AI" },
  { en: "Embedding", vi: "Vector nhúng / Embedding", category: "AI" },
  { en: "Tokenization", vi: "Phân tách token", category: "AI" },
  { en: "Inference", vi: "Suy luận", category: "AI" },
  { en: "Training", vi: "Huấn luyện", category: "AI" },
  { en: "Hyperparameter", vi: "Siêu tham số", category: "AI" },
  { en: "Overfitting", vi: "Quá khớp", category: "AI" },
  { en: "Underfitting", vi: "Khớp kém / Dưới khớp", category: "AI" },
  { en: "Bias", vi: "Độ lệch / Thiên kiến", category: "AI" },
  { en: "Variance", vi: "Phương sai", category: "AI" },
  { en: "Attention Mechanism", vi: "Cơ chế chú ý (Attention)", category: "AI" },
  { en: "Self-Attention", vi: "Tự chú ý (Self-Attention)", category: "AI" },
  { en: "Multi-head Attention", vi: "Chú ý đa đầu", category: "AI" },
  { en: "Retrieval-Augmented Generation", vi: "Tạo sinh tăng cường truy xuất (RAG)", category: "AI" },
  { en: "Explainable AI", vi: "AI có thể giải thích (XAI)", category: "AI" },
  { en: "Edge AI", vi: "AI biên", category: "AI" },
  { en: "Federated Learning", vi: "Học liên kết", category: "AI" },
  { en: "Agentic AI", vi: "AI tự chủ / AI tác tử", category: "AI" },
  { en: "Multi-Agent System", vi: "Hệ thống đa tác tử", category: "AI" },

  // ===== DATA SCIENCE =====
  { en: "Data Science", vi: "Khoa học dữ liệu", category: "Data" },
  { en: "Big Data", vi: "Dữ liệu lớn", category: "Data" },
  { en: "Data Mining", vi: "Khai phá dữ liệu", category: "Data" },
  { en: "Data Pipeline", vi: "Đường ống dữ liệu", category: "Data" },
  { en: "ETL", vi: "Trích xuất - Chuyển đổi - Tải (ETL)", category: "Data" },
  { en: "Data Warehouse", vi: "Kho dữ liệu", category: "Data" },
  { en: "Data Lake", vi: "Hồ dữ liệu", category: "Data" },
  { en: "Feature Engineering", vi: "Kỹ thuật đặc trưng", category: "Data" },
  { en: "Data Augmentation", vi: "Tăng cường dữ liệu", category: "Data" },
  { en: "Batch Processing", vi: "Xử lý theo lô", category: "Data" },
  { en: "Stream Processing", vi: "Xử lý dòng", category: "Data" },
  { en: "Real-time Analytics", vi: "Phân tích thời gian thực", category: "Data" },

  // ===== SOFTWARE ENGINEERING =====
  { en: "Software Engineering", vi: "Kỹ thuật phần mềm", category: "Engineering" },
  { en: "Algorithm", vi: "Thuật toán", category: "Engineering" },
  { en: "Data Structure", vi: "Cấu trúc dữ liệu", category: "Engineering" },
  { en: "API", vi: "Giao diện lập trình ứng dụng (API)", category: "Engineering" },
  { en: "REST API", vi: "API REST", category: "Engineering" },
  { en: "GraphQL", vi: "GraphQL", category: "Engineering" },
  { en: "Microservices", vi: "Kiến trúc vi dịch vụ", category: "Engineering" },
  { en: "Monolithic", vi: "Kiến trúc nguyên khối", category: "Engineering" },
  { en: "Serverless", vi: "Không máy chủ (Serverless)", category: "Engineering" },
  { en: "Container", vi: "Container / Thùng chứa", category: "Engineering" },
  { en: "Docker", vi: "Docker", category: "Engineering" },
  { en: "Kubernetes", vi: "Kubernetes (K8s)", category: "Engineering" },
  { en: "CI/CD", vi: "Tích hợp liên tục / Triển khai liên tục", category: "Engineering" },
  { en: "DevOps", vi: "DevOps", category: "Engineering" },
  { en: "MLOps", vi: "MLOps (Vận hành ML)", category: "Engineering" },
  { en: "Version Control", vi: "Quản lý phiên bản", category: "Engineering" },
  { en: "Git", vi: "Git", category: "Engineering" },
  { en: "Repository", vi: "Kho mã nguồn", category: "Engineering" },
  { en: "Framework", vi: "Framework / Khung làm việc", category: "Engineering" },
  { en: "Library", vi: "Thư viện", category: "Engineering" },
  { en: "SDK", vi: "Bộ công cụ phát triển phần mềm (SDK)", category: "Engineering" },
  { en: "Middleware", vi: "Phần mềm trung gian", category: "Engineering" },
  { en: "Backend", vi: "Backend / Phía máy chủ", category: "Engineering" },
  { en: "Frontend", vi: "Frontend / Phía người dùng", category: "Engineering" },
  { en: "Full-stack", vi: "Full-stack", category: "Engineering" },
  { en: "Deployment", vi: "Triển khai", category: "Engineering" },
  { en: "Scalability", vi: "Khả năng mở rộng", category: "Engineering" },
  { en: "Latency", vi: "Độ trễ", category: "Engineering" },
  { en: "Throughput", vi: "Thông lượng", category: "Engineering" },
  { en: "Load Balancing", vi: "Cân bằng tải", category: "Engineering" },
  { en: "Caching", vi: "Bộ nhớ đệm", category: "Engineering" },

  // ===== DIGITAL TWIN & INDUSTRY 4.0 =====
  { en: "Digital Twin", vi: "Bản sao số", category: "Industry 4.0" },
  { en: "Industry 4.0", vi: "Công nghiệp 4.0", category: "Industry 4.0" },
  { en: "Industry 5.0", vi: "Công nghiệp 5.0", category: "Industry 4.0" },
  { en: "Smart Factory", vi: "Nhà máy thông minh", category: "Industry 4.0" },
  { en: "Smart Manufacturing", vi: "Sản xuất thông minh", category: "Industry 4.0" },
  { en: "Cyber-Physical System", vi: "Hệ thống không gian mạng-vật lý (CPS)", category: "Industry 4.0" },
  { en: "Industrial IoT", vi: "IoT công nghiệp (IIoT)", category: "Industry 4.0" },
  { en: "Predictive Maintenance", vi: "Bảo trì dự đoán", category: "Industry 4.0" },
  { en: "Condition Monitoring", vi: "Giám sát tình trạng", category: "Industry 4.0" },
  { en: "Fault Detection", vi: "Phát hiện lỗi", category: "Industry 4.0" },
  { en: "Anomaly Detection", vi: "Phát hiện bất thường", category: "Industry 4.0" },
  { en: "Quality Control", vi: "Kiểm soát chất lượng", category: "Industry 4.0" },
  { en: "Process Optimization", vi: "Tối ưu hóa quy trình", category: "Industry 4.0" },
  { en: "Supply Chain", vi: "Chuỗi cung ứng", category: "Industry 4.0" },
  { en: "Automation", vi: "Tự động hóa", category: "Industry 4.0" },
  { en: "Robotics", vi: "Robot học", category: "Industry 4.0" },
  { en: "Autonomous System", vi: "Hệ thống tự hành", category: "Industry 4.0" },
  { en: "Human-Robot Collaboration", vi: "Hợp tác người-robot", category: "Industry 4.0" },

  // ===== CONSTRUCTION & BIM =====
  { en: "BIM", vi: "Mô hình thông tin công trình (BIM)", category: "Construction" },
  { en: "Building Information Modeling", vi: "Mô hình thông tin công trình", category: "Construction" },
  { en: "CAD", vi: "Thiết kế hỗ trợ máy tính (CAD)", category: "Construction" },
  { en: "3D Modeling", vi: "Mô hình hóa 3D", category: "Construction" },
  { en: "Point Cloud", vi: "Đám mây điểm", category: "Construction" },
  { en: "LiDAR", vi: "LiDAR", category: "Construction" },
  { en: "Photogrammetry", vi: "Trắc quang học", category: "Construction" },
  { en: "Semantic Segmentation", vi: "Phân đoạn ngữ nghĩa", category: "Construction" },
  { en: "Object Detection", vi: "Phát hiện đối tượng", category: "Construction" },
  { en: "Site Monitoring", vi: "Giám sát công trường", category: "Construction" },
  { en: "Progress Tracking", vi: "Theo dõi tiến độ", category: "Construction" },
  { en: "Structural Health Monitoring", vi: "Giám sát sức khỏe kết cấu", category: "Construction" },
  { en: "Clash Detection", vi: "Phát hiện xung đột", category: "Construction" },
  { en: "Interoperability", vi: "Khả năng tương tác", category: "Construction" },

  // ===== IoT & EMBEDDED SYSTEMS =====
  { en: "Internet of Things", vi: "Internet vạn vật (IoT)", category: "IoT" },
  { en: "Embedded System", vi: "Hệ thống nhúng", category: "IoT" },
  { en: "Sensor", vi: "Cảm biến", category: "IoT" },
  { en: "Actuator", vi: "Bộ truyền động", category: "IoT" },
  { en: "Edge Computing", vi: "Điện toán biên", category: "IoT" },
  { en: "Fog Computing", vi: "Điện toán sương mù", category: "IoT" },
  { en: "Cloud Computing", vi: "Điện toán đám mây", category: "IoT" },
  { en: "Real-time System", vi: "Hệ thống thời gian thực", category: "IoT" },
  { en: "MQTT", vi: "MQTT (Giao thức IoT)", category: "IoT" },
  { en: "Firmware", vi: "Phần mềm cơ sở", category: "IoT" },
  { en: "Microcontroller", vi: "Vi điều khiển", category: "IoT" },
  { en: "FPGA", vi: "Mảng cổng lập trình (FPGA)", category: "IoT" },
  { en: "ASIC", vi: "Mạch tích hợp chuyên dụng (ASIC)", category: "IoT" },
  { en: "Low-power Design", vi: "Thiết kế công suất thấp", category: "IoT" },

  // ===== SECURITY =====
  { en: "Cybersecurity", vi: "An ninh mạng", category: "Security" },
  { en: "Encryption", vi: "Mã hóa", category: "Security" },
  { en: "Authentication", vi: "Xác thực", category: "Security" },
  { en: "Authorization", vi: "Phân quyền", category: "Security" },
  { en: "Blockchain", vi: "Chuỗi khối (Blockchain)", category: "Security" },
  { en: "Smart Contract", vi: "Hợp đồng thông minh", category: "Security" },
  { en: "Zero Trust", vi: "Không tin tưởng (Zero Trust)", category: "Security" },
  { en: "Vulnerability", vi: "Lỗ hổng bảo mật", category: "Security" },
  { en: "Threat Detection", vi: "Phát hiện mối đe dọa", category: "Security" },
  { en: "Intrusion Detection", vi: "Phát hiện xâm nhập", category: "Security" },
  { en: "Firewall", vi: "Tường lửa", category: "Security" },
  { en: "Privacy", vi: "Quyền riêng tư", category: "Security" },
  { en: "Data Protection", vi: "Bảo vệ dữ liệu", category: "Security" },

  // ===== HEALTHCARE & BIOMEDICAL =====
  { en: "Healthcare AI", vi: "AI y tế", category: "Healthcare" },
  { en: "Medical Imaging", vi: "Hình ảnh y khoa", category: "Healthcare" },
  { en: "Diagnostic AI", vi: "AI chẩn đoán", category: "Healthcare" },
  { en: "Drug Discovery", vi: "Khám phá thuốc", category: "Healthcare" },
  { en: "Genomics", vi: "Hệ gen học", category: "Healthcare" },
  { en: "Bioinformatics", vi: "Tin sinh học", category: "Healthcare" },
  { en: "Electronic Health Record", vi: "Hồ sơ sức khỏe điện tử (EHR)", category: "Healthcare" },
  { en: "Telemedicine", vi: "Y học từ xa", category: "Healthcare" },
  { en: "Wearable Device", vi: "Thiết bị đeo", category: "Healthcare" },
  { en: "Vital Signs", vi: "Dấu hiệu sinh tồn", category: "Healthcare" },

  // ===== GENERAL RESEARCH TERMS =====
  { en: "State-of-the-art", vi: "Tiên tiến nhất / Hiện đại nhất", category: "Research" },
  { en: "Benchmark", vi: "Chuẩn đánh giá", category: "Research" },
  { en: "Baseline", vi: "Đường cơ sở", category: "Research" },
  { en: "Ablation Study", vi: "Nghiên cứu loại bỏ", category: "Research" },
  { en: "Case Study", vi: "Nghiên cứu điển hình", category: "Research" },
  { en: "Proof of Concept", vi: "Chứng minh khái niệm (PoC)", category: "Research" },
  { en: "Prototype", vi: "Nguyên mẫu", category: "Research" },
  { en: "Scalable", vi: "Có khả năng mở rộng", category: "Research" },
  { en: "Robust", vi: "Bền vững / Robust", category: "Research" },
  { en: "Novel", vi: "Mới lạ", category: "Research" },
  { en: "Framework", vi: "Khung / Framework", category: "Research" },
  { en: "Methodology", vi: "Phương pháp luận", category: "Research" },
  { en: "Experimental Results", vi: "Kết quả thực nghiệm", category: "Research" },
  { en: "Performance Evaluation", vi: "Đánh giá hiệu suất", category: "Research" },
  { en: "Comparative Analysis", vi: "Phân tích so sánh", category: "Research" },
  { en: "Literature Review", vi: "Tổng quan tài liệu", category: "Research" },
  { en: "Future Work", vi: "Hướng phát triển tương lai", category: "Research" },
];

/**
 * Tạo glossary string để đưa vào prompt
 */
export function getGlossaryForPrompt(categories?: string[]): string {
  let entries = IT_GLOSSARY;
  
  if (categories && categories.length > 0) {
    entries = entries.filter(e => categories.includes(e.category));
  }
  
  const lines = entries.map(e => `- "${e.en}" → "${e.vi}"`);
  return lines.join('\n');
}

/**
 * Lấy danh sách categories có trong glossary
 */
export function getGlossaryCategories(): string[] {
  const cats = new Set(IT_GLOSSARY.map(e => e.category));
  return Array.from(cats);
}

/**
 * Tìm thuật ngữ trong glossary
 */
export function findTerm(term: string): GlossaryEntry | undefined {
  const lower = term.toLowerCase();
  return IT_GLOSSARY.find(e => 
    e.en.toLowerCase() === lower || 
    e.vi.toLowerCase() === lower
  );
}

/**
 * Export glossary dạng map để lookup nhanh
 */
export const GLOSSARY_MAP: Map<string, string> = new Map(
  IT_GLOSSARY.map(e => [e.en.toLowerCase(), e.vi])
);
