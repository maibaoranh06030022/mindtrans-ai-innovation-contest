import google.generativeai as genai

# DÁN KEY CỦA BẠN VÀO ĐÂY
GEMINI_KEY = "AIzaSyDmefEYNHMwqSB_WI7oPiZfo8RkJaMluPg"

genai.configure(api_key=GEMINI_KEY)

print("Đang kết nối tới Google để lấy danh sách Model...")
try:
    print("------------------------------------------------")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ Model có sẵn: {m.name}")
    print("------------------------------------------------")
except Exception as e:
    print(f"❌ Lỗi: {e}")