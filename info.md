# AI Battle Arena

## Ý tưởng

Một platform open source cho phép 2 AI model đấu với nhau qua các board game. AI không chat qua lại mà thật sự chơi game — dùng tool calling để quan sát bàn cờ, phân tích thế trận, và đưa ra nước đi. Game engine đóng vai trọng tài, verify mọi nước đi và enforce luật chơi.

User clone repo về máy, chạy `docker compose up`, nhập OpenRouter API key, chọn 2 model bất kỳ rồi xem chúng đấu nhau realtime.

Dùng OpenRouter làm gateway duy nhất — 1 key truy cập được hàng trăm model từ Anthropic, OpenAI, Google, Meta, Mistral...

## Cách AI chơi game

Mỗi lượt, game engine gọi AI qua OpenRouter với tool definitions. AI tự quyết định gọi tool nào:

1. Gọi `get_board_state()` để xem bàn cờ
2. Gọi `get_valid_moves()` hoặc các tool phân tích khác
3. Gọi `make_move()` để đi nước — engine verify, nếu sai thì AI retry (tối đa 3 lần, sau đó forfeit)

Toàn bộ quá trình được record lại để xem replay.

## Games

- **Caro (Gomoku)** — board 15x15, 5 quân liên tiếp thắng
- **Chess** — luật chuẩn FIDE, bao gồm castling, en passant, promotion
- **Battleship** — 2 phase: đặt tàu + bắn xen kẽ, incomplete information

## Tính năng

### Core
- Chọn 2 model bất kỳ từ OpenRouter cho Player 1 và Player 2
- Nhập OpenRouter API key (1 key dùng cho cả 2 player)
- Nút test connection trước khi bắt đầu
- Game loop tự động: engine gọi AI → AI gọi tools → engine verify → next turn
- Xử lý invalid move: retry 3 lần với error message rõ ràng, sau đó forfeit
- WebSocket realtime cập nhật UI mỗi nước đi

### Game UI
- Board render cho từng game (grid cho caro, chess board, 2 board cho battleship)
- Highlight nước đi mới nhất
- Thinking indicator khi AI đang suy nghĩ
- Hiển thị AI reasoning và tool calls mỗi lượt
- Hiển thị thinking time, token count, estimated cost
- Speed control (delay giữa các nước)
- Step-by-step mode (nhấn next để đi nước tiếp)
- Pause / Resume / Reset

### Replay & AI Thinking Log
- Record lưu danh sách nước đi theo thứ tự (ai đi, tọa độ/nước gì, turn số mấy)
- Khi xem replay, game engine chạy lại từ đầu theo danh sách nước đi đã lưu — không cần lưu board state
- Replay viewer có play/pause, speed control, kéo đến turn bất kỳ
- Mỗi nước đi kèm AI thinking log: toàn bộ text AI suy nghĩ trước khi quyết định (reasoning, phân tích thế trận, lý do chọn nước đi) — để user đọc và đánh giá AI có suy nghĩ logic không, có nhìn ra thế cờ không
- Log cả các lần AI đi sai (invalid move) và lý do sai — cho thấy model nào hay hiểu sai luật
- Export replay ra JSON
- Match history list tất cả trận đã chơi, filter theo game/model/result

### Stats
- Win/loss/draw record theo từng cặp model
- Average thinking time per move
- Token usage và estimated cost per game
- Số lần invalid move theo model
- So sánh stats 2 player side-by-side sau mỗi trận

### Infrastructure
- Docker compose: 1 lệnh chạy cả frontend + backend
- API key chỉ sống trong container trên máy user
- Game records lưu trên disk qua Docker volume
- Option set key qua environment variable hoặc nhập qua UI