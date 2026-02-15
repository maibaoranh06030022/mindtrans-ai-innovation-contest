import json
import time
import requests
import google.generativeai as genai
from newspaper import Article

# =======================================================
# CẤU HÌNH (ĐIỀN KEY CỦA BẠN VÀO)
# =======================================================
SUPABASE_URL = "eudvbbunohfthdbyuegg"  # Ví dụ: https://xyz.supabase.co
SUPABASE_KEY = "sb_publishable_E9XK6jxPtU7kkPp2157rIg_MTK5sCui"
GEMINI_KEY = "AIzaSyDmefEYNHMwqSB_WI7oPiZfo8RkJaMluPg"

genai.configure(api_key=GEMINI_KEY)

# =======================================================
# 1. HÀM CÀO BÁO (Crawler)
# =======================================================
def get_article_content(url):
    try:
        print(f"🕷️ Đang đọc báo tại: {url}")
        article = Article(url)
        article.download()
        article.parse()
        return {
            "title": article.title,
            "text": article.text,
            "url": url
        }
    except Exception as e:
        print(f"⚠️ Lỗi cào báo (Có thể do web chặn bot): {e}")
        return None

# =======================================================
# 2. HÀM XỬ LÝ AI & LOGIC LỌC
# =======================================================
def process_and_save(url):
    # --- BƯỚC A: Lấy nội dung ---
    raw_data = get_article_content(url)
    if not raw_data: return

    print(f"🤖 Đang phân tích bài: '{raw_data['title']}'...")

    # --- BƯỚC B: Prompt yêu cầu Tags ---
    prompt = f"""
    Đọc bài báo sau:
    TIÊU ĐỀ: {raw_data['title']}
    NỘI DUNG: {raw_data['text'][:8000]}

    Nhiệm vụ:
    1. Dịch tóm tắt sang tiếng Việt (khoảng 200 từ).
    2. Trích xuất tối đa 5 thẻ (TAGS) phân loại quan trọng (Ví dụ: ["AI", "Technology", "Deep Learning"]).
    3. Tạo Mindmap code (MermaidJS graph TD).
    4. Tạo 3 câu hỏi Flashcard.

    Trả về JSON duy nhất:
    {{
        "content_vi": "...",
        "tags": ["Tag1", "Tag2", "..."], 
        "mindmap_code": "graph TD; ...",
        "flashcards": [ {{ "q": "...", "a": "..." }} ]
    }}
    """

    try:
        # Sử dụng model mới nhất và tốt nhất cho dự án thi
        model = genai.GenerativeModel('gemini-2.5-flash') 
        
        response = model.generate_content(prompt)
        text_res = response.text.replace('```json', '').replace('```', '').strip()
        ai_data = json.loads(text_res)

        # --- BƯỚC C: LOGIC KIỂM TRA ĐIỀU KIỆN (The >= 2 Rule) ---
        tags = ai_data.get('tags', [])
        tag_count = len(tags)
        
        print(f"🧐 AI tìm thấy {tag_count} thẻ: {tags}")

        if tag_count >= 2:
            # Đủ điều kiện -> Lưu vào DB
            save_to_supabase(raw_data['title'], raw_data['url'], ai_data)
        else:
            # Không đủ điều kiện -> Bỏ qua
            print(f"🚫 Bài viết bị loại vì chỉ có {tag_count} thẻ (Yêu cầu >= 2).")

    except Exception as e:
        print(f"❌ Lỗi AI: {e}")

# =======================================================
# 3. HÀM LƯU DATABASE
# =======================================================
def save_to_supabase(title, url, ai_data):
    endpoint = f"{SUPABASE_URL}/rest/v1/documents"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    payload = {
        "topic": title,
        "content_vi": ai_data['content_vi'],
        "mindmap_code": ai_data['mindmap_code'],
        "flashcards": ai_data['flashcards'],
        "tags": ai_data['tags'], # Lưu mảng tags vào cột mới tạo
        "url": url               # Lưu link gốc để user tham khảo
    }

    r = requests.post(endpoint, headers=headers, json=payload)
    if r.status_code == 201:
        print(f"✅ ĐÃ DUYỆT & LƯU VÀO KHO: {title}")
    else:
        print(f"⚠️ Lỗi lưu DB: {r.text}")

# =======================================================
# CHẠY THỰC TẾ
# =======================================================
if __name__ == "__main__":
    # Danh sách các bài báo uy tín (Bạn có thể thêm 1000 link vào đây)
    # Mẹo: Đừng chạy 1000 link một lúc, hãy chạy từng đợt 50 bài.
    seed_urls = [
    "https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components",
    "https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components",
    "https://react.dev/blog/2025/10/16/react-conf-2025-recap",
    "https://react.dev/blog/2025/10/07/react-compiler-v1",
    "https://react.dev/blog/2025/10/07/introducing-the-react-foundation",
    "https://react.dev/blog/2025/10/01/react-19-2",
    "https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity",
    "https://react.dev/blog/2025/02/14/sunsetting-create-react-app",
    ]
    
    print("🚀 Bắt đầu quy trình duyệt bài tự động...")
    for url in seed_urls:
        process_and_save(url)
        print("⏳ Nghỉ 15s...") # Quan trọng để không bị Google chặn
        time.sleep(15)