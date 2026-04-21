Một mẹo rất quan trọng

Khi làm bất kỳ phần nào, luôn ghi lại 4 thứ này:

1. Mình đã làm gì?

   Ví dụ:

- chuyển cột date sang datetime
- bỏ dấu phẩy ở cột giá
- chuẩn hóa close/open/high/low sang float 2. Vì sao làm như vậy?

2. Vì sao làm như vậy?

   Ví dụ:

- để thuận tiện cho phân tích chuỗi thời gian
- để tránh lỗi khi tính toán thống kê và huấn luyện mô hình 3. Kết quả ra sao?

3. Kết quả ra sao?

   Ví dụ:

- dữ liệu còn 784 dòng hợp lệ
- không còn missing ở các cột giá chính 4. Chứng minh bằng gì?

4. Chứng minh bằng gì?

   Ví dụ:

- bảng df.info()
- hình head() trước/sau
- biểu đồ
- bảng metric
