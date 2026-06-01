# Japanese SRS - Current Logic

Tai lieu nay mo ta **logic SRS hien tai cua tieng Nhat** trong codebase, dua tren code dang chay thuc te cua:

- [JapaneseService.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Services\JapaneseService.php)
- [JpWord.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Models\JpWord.php)

Muc tieu cua tai lieu nay la:

- giai thich dung logic SRS dang thuc thi
- tach ro current behavior va intended policy
- lam co so de sau nay refactor sang schema moi hoac DB moi

---

## 1. Tong quan

Logic SRS cua tieng Nhat hien tai dang duoc xay tren **tung tu rieng le** trong bang `jp_words`.

Moi tu co mot trang thai nho rieng, duoc quyet dinh boi cac field:

- `level`
- `streak`
- `lapses`
- `last_reviewed_at`
- `next_review_at`
- `last_quiz_type`

SRS hien tai la kieu:

- review den han dua tren `next_review_at`
- tra loi dung thi tang level
- tra loi sai thi giam level
- streak lam tang interval
- lapses lam giam interval

No chua phai la FSRS hay SM-2 day du, ma la mot custom policy don gian.

---

## 2. Noi luu trang thai SRS

Trong [JpWord.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Models\JpWord.php), model `JpWord` cho phep fill cac field lien quan den SRS:

- `level`
- `last_reviewed_at`
- `next_review_at`
- `streak`
- `lapses`
- `last_quiz_type`

### Y nghia tung field

| Field | Vai tro |
| :--- | :--- |
| `level` | Cap do nho hien tai cua tu, tu 1 den 9 |
| `streak` | So lan tra loi dung lien tiep |
| `lapses` | So lan quen / tra loi sai da tich luy |
| `last_reviewed_at` | Thoi diem review gan nhat |
| `next_review_at` | Thoi diem den han review tiep theo |
| `last_quiz_type` | Loai quiz gan nhat da dung cho tu do |

### Nhan xet

Thiet ke hien tai dang **gan SRS state truc tiep vao bang tu vung**.

Dieu nay don gian de lam ban dau, nhung sau nay neu mo rong:

- mot tu co nhieu che do hoc
- nhieu profile hoc
- tracking lich su chi tiet hon

thi nen tach state sang bang rieng.

---

## 3. Cach mot tu moi duoc khoi tao lich on

Co 2 duong chinh de them tu:

1. import vocabulary
2. add word thu cong

## 3.1 Import vocabulary

Trong [JapaneseService.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Services\JapaneseService.php:32), khi import:

- `streak = 0`
- `lapses = 0`
- `last_reviewed_at = now() - 3 days`
- `next_review_at = now() - 2 days`

### Y nghia

Import xong la tu gan nhu **den han review ngay**.

Day la mot cach ep du lieu moi di vao hang cho on tap som, thay vi phai doi.

## 3.2 Add word thu cong

Trong [JapaneseService.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Services\JapaneseService.php:147), khi add thu cong:

- lay `level` tu input, mac dinh la `1`
- `streak = 0`
- `lapses = 0`
- `last_reviewed_at = now()`
- `next_review_at = now() + calculateInterval(level, 0, 0)`

### Y nghia

Them tay thi tu **khong den han ngay lap tuc**, ma duoc xep lich theo level khoi tao.

---

## 4. Dieu kien mot tu duoc dua vao review

Trong [JapaneseService.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Services\JapaneseService.php:342) va [JapaneseService.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Services\JapaneseService.php:600), mot tu duoc xem la can on khi:

- `user_id` dung voi user hien tai
- `is_active = true`
- `next_review_at <= now`

Ngoai ra, he thong tach thanh 2 nhom:

- `is_grammar = false` cho tu vung
- `is_grammar = true` cho ngu phap

### Y nghia

SRS hien tai dung cung mot co che cho:

- tu vung thuong
- mau ngu phap

nhung phan thong ke va practice scenario duoc tach rieng.

---

## 5. Diem vao chinh cua SRS update

Logic cap nhat SRS nam trong:

- [JapaneseService.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Services\JapaneseService.php:497)

Ham:

- `updateReviewedWords(array $reviewedWords, int $userId): array`

Day la noi backend nhan ket qua review tu frontend va cap nhat lai:

- level
- streak
- lapses
- last_reviewed_at
- next_review_at
- last_quiz_type

---

## 6. Input ma SRS dang dung

Moi log review duoc backend doc tu payload voi cac truong chinh:

- `word.id`
- `firstFailed`
- `reviewedAt`
- `quizType`

### Y nghia tung input

| Input | Y nghia |
| :--- | :--- |
| `word.id` | ID tu duoc review |
| `firstFailed` | User co sai o lan dau hay khong |
| `reviewedAt` | Thoi diem frontend xac nhan da review |
| `quizType` | Loai bai vua dung |

### Diem quan trong

Policy hien tai dua tren mot flag rat manh:

- `firstFailed = true` xem nhu failed review
- `firstFailed = false` xem nhu passed review

No **khong phan biet muc do dung / sai nhieu muc**, ma chi co 2 trang thai chinh:

- pass
- fail

---

## 7. Logic khi tra loi sai

Trong [JapaneseService.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Services\JapaneseService.php:543), neu `firstFailed = true`:

- `newLevel = max(1, currentLevel - 1)`
- `newStreak = 0`
- `newLapses = currentLapses + 1`

### Tac dong

1. **Giam 1 level**
   - Khong giam qua level 1

2. **Reset streak**
   - Chuoi dung lien tiep bi cat ngay

3. **Tang lapses**
   - Ghi nhan tu nay da bi quen them 1 lan

### Y nghia nghiep vu

Tra loi sai dong nghia voi:

- he thong giam do tin cay cua tu
- he thong day lich review gan hon thong qua level giam va lapse tang

---

## 8. Logic khi tra loi dung

Trong [JapaneseService.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Services\JapaneseService.php:549), neu `firstFailed = false`:

- `newLevel = min(9, currentLevel + 1)`
- `newStreak = currentStreak + 1`
- `newLapses = currentLapses`

Sau do co them co che decay:

- neu `newStreak % 3 == 0` thi `newLapses = max(0, newLapses - 1)`

### Tac dong

1. **Tang 1 level**
   - Khong vuot qua level 9

2. **Tang streak**
   - Ghi nhan user dang nho tu nay on dinh hon

3. **Decay lapses**
   - Moi khi dat moc 3, 6, 9, 12... lan dung lien tiep
   - thi giam lapses di 1

### Y nghia nghiep vu

He thong coi viec tra loi dung lien tiep la dau hieu tu dang on dinh tro lai.

`lapses` khong bi xoa ngay lap tuc, ma duoc giam dan theo thoi gian thong qua streak.

Day la mot co che rat quan trong:

- da quen nhieu lan thi interval bi phat
- nhung neu ve sau hoc tot lien tiep, hinh phat duoc giam dan

---

## 9. Logic dac biet cho stroke practice

Trong [JapaneseService.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Services\JapaneseService.php:523), neu:

- `quizType === 'multiCharStrokePractice'`

thi he thong **khong dung luat pass/fail thong thuong**.

Thay vao do:

- `newLevel = currentLevel`
- `newStreak = currentStreak`
- `newLapses = currentLapses`
- `intervalSeconds = 3600`
- `nextReviewAt = reviewedAt + 1 hour`

### Y nghia

Stroke practice duoc xem la mot bai phu:

- khong tang level
- khong giam level
- khong thuong streak
- khong phat lapses

No chi day lich review sang 1 gio sau.

### Ghi chu quan trong

O phan tao practice scenario, logic sinh stroke practice dang bi tat tam thoi. Vi vay tren thuc te:

- code co ho tro special case nay
- nhung session review binh thuong hien tai it hoac khong chay den no

---

## 10. Cach interval duoc tinh

Interval duoc tinh trong:

- [JapaneseService.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Services\JapaneseService.php:803)

Cong thuc:

`interval = round(baseWait(level) * streakFactor(streak) * lapseFactor(lapses))`

Sau do:

- ep toi thieu la `30 seconds`

### Ghi chu quan trong

Logic tieng Nhat hien tai:

- **co dung level**
- **co dung streak**
- **co dung lapses**
- **khong dung quizFactor**

Tuc la quiz type duoc luu vao `last_quiz_type`, nhung **khong anh huong truc tiep den interval**, ngoai tru special case stroke practice.

---

## 11. Base wait theo level

Trong [JapaneseService.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Services\JapaneseService.php:784), base interval cua tung level la:

| Level | Base wait |
| :--- | :--- |
| `1` | `30 seconds` |
| `2` | `10 minutes` |
| `3` | `1 day` |
| `4` | `3 days` |
| `5` | `7 days` |
| `6` | `21 days` |
| `7` | `90 days` |
| `8` | `180 days` |
| `9` | `360 days` |

### Nhan xet

Bang muc nay co dac diem:

- level 1 va 2 rat ngan
- tu level 3 tro len tang kha nhanh
- level 6 -> 7 nhay manh tu 21 ngay len 90 ngay

Day la he thong level-based interval khá ro rang, de hieu, nhung cung mang tinh thu cong.

---

## 12. Streak factor

Trong [JapaneseService.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Services\JapaneseService.php:754), streak factor hien tai la:

| Dieu kien | Factor |
| :--- | :--- |
| `streak <= 1` | `1.00` |
| `streak <= 3` | `1.15` |
| `streak > 3` | `1.30` |

### Y nghia

Neu mot tu duoc tra loi dung lien tiep nhieu hon:

- interval duoc nhan len
- tu se quay lai cham hon

### Vi du

Neu level 5 co base wait 7 ngay:

- streak 1 -> 7 ngay
- streak 2 hoac 3 -> 7 * 1.15 = 8.05 ngay
- streak 4+ -> 7 * 1.30 = 9.1 ngay

### Nhan xet

Factor nay kha don gian, chi co 3 bac.

---

## 13. Lapse factor

Trong [JapaneseService.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Services\JapaneseService.php:768), lapse factor hien tai la:

| Dieu kien | Factor |
| :--- | :--- |
| `lapses <= 1` | `1.00` |
| `lapses <= 4` | `0.85` |
| `lapses <= 7` | `0.70` |
| `lapses > 7` | `0.60` |

### Y nghia

Cang quen nhieu lan:

- interval bi rut ngan
- tu se quay lai som hon

### Vi du

Neu level 5 co base wait 7 ngay:

- lapses 0 hoặc 1 -> 7 ngay
- lapses 2-4 -> 5.95 ngay
- lapses 5-7 -> 4.9 ngay
- lapses 8+ -> 4.2 ngay

### Nhan xet

Day la hinh phat theo bac.

No khong lien tuc, ma chia thanh nhom:

- rat on dinh
- hoi bat on
- bat on
- rat bat on

---

## 14. Vi du tinh interval day du

### Truong hop 1: tra loi dung

Gia su tu hien tai:

- currentLevel = 4
- currentStreak = 2
- currentLapses = 1

User tra loi dung:

- `newLevel = 5`
- `newStreak = 3`
- `newLapses` ban dau = 1
- vi `newStreak % 3 == 0` nen `newLapses = 0`

Khi do:

- level 5 => base wait = 7 ngay
- streak 3 => factor 1.15
- lapses 0 => factor 1.00

Interval:

- `7 days * 1.15 * 1.00 = 8.05 days`

### Truong hop 2: tra loi sai

Gia su tu hien tai:

- currentLevel = 4
- currentStreak = 2
- currentLapses = 1

User tra loi sai:

- `newLevel = 3`
- `newStreak = 0`
- `newLapses = 2`

Khi do:

- level 3 => 1 ngay
- streak 0 => factor 1.00
- lapses 2 => factor 0.85

Interval:

- `1 day * 1.00 * 0.85 = 0.85 day`

Tuc la khoang:

- `20.4 hours`

---

## 15. Cap nhat field sau moi lan review

Sau khi tinh xong state moi, he thong update:

- `level`
- `streak`
- `lapses`
- `last_reviewed_at`
- `next_review_at`
- `last_quiz_type`

Thuc hien tai:

- [JapaneseService.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Services\JapaneseService.php:567)

### Y nghia

`last_quiz_type` khong anh huong truc tiep den interval, nhung duoc luu lai de:

- tham khao
- tranh lap quiz type o lan sau

---

## 16. Logic daily streak

Ngoai SRS theo tung tu, he thong con co **streak theo ngay** thong qua bang `jp_daily_logs`.

Khi co bat ky review nao duoc update thanh cong:

- he thong ghi log ngay hien tai voi `status = true`

Thuc hien tai:

- [JapaneseService.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Services\JapaneseService.php:579)

### Muc dich

Bang nay khong phai SRS state cua tung tu.

No dung de:

- hien thi streak hoc tap theo ngay
- thong ke dashboard

### Cach tinh streak ngay

Trong [JapaneseService.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Services\JapaneseService.php:814):

- neu hom nay da hoc -> tinh tiep tu hom nay lui ve
- neu hom nay chua hoc nhung hom qua co hoc -> van giu chuoi
- neu hom qua cung khong hoc -> chuoi dut

He thong con co mot so buoc cleanup log cu khi gap ngay false / gap chuoi dut.

### Y nghia

Can tach ro:

- `streak` trong `jp_words` = streak nho mot tu
- streak trong `jp_daily_logs` = streak hoc theo ngay cua user

Day la hai khai niem hoan toan khac nhau.

---

## 17. Logic chon quiz type cua tieng Nhat

Phan nay khong phai cong thuc SRS cot loi, nhung co anh huong den trai nghiem review.

Trong [JapaneseService.php](C:\Users\thanh\Desktop\ProjectWEb\server\app\Services\JapaneseService.php:835), quiz type co the la:

- `multiple`
- `ReadingHiraganaPractice`
- `TypingRomajiPractice`
- `voicePractice`

Stroke practice dang tam tat.

### Rule chon quiz

1. Neu tu khong co Kanji:
   - bo `ReadingHiraganaPractice`

2. Neu tu la pure katakana hoac pure hiragana:
   - bo `ReadingHiraganaPractice`

3. Neu quiz type vua xong la type nao:
   - co gang khong lap lai ngay type do

4. `last_quiz_type` duoc dung de tham khao tranh lap lai quiz stroke lien tiep qua session

### Y nghia

He thong dang co gang:

- tao da dang quiz
- tranh lap quiz lien tiep
- phu hop voi dac diem mat chu cua tu

Nhung phan nay hien tai **khong anh huong den cong thuc interval**, ngoai special case stroke.

---

## 18. Diem lech giua current code va policy test moi

Trong repo co:

- [SrsIntervalTest.php](C:\Users\thanh\Desktop\ProjectWEb\server\tests\Unit\SrsIntervalTest.php)

File test nay mo ta mot policy moi hon, nhung **khong giong 100% voi logic dang chay cua JapaneseService**.

## 18.1 Khac nhau o base interval

Test policy:

- level 1 = 10 phut
- level 2 = 8 gio
- level 6 = 15 ngay
- level 7 = 30 ngay
- level 8 = 60 ngay
- level 9 = 120 ngay

Current Japanese code:

- level 1 = 30 giay
- level 2 = 10 phut
- level 6 = 21 ngay
- level 7 = 90 ngay
- level 8 = 180 ngay
- level 9 = 360 ngay

## 18.2 Khac nhau o streak factor

Test policy:

- `<=1` => `1.00`
- `2..3` => `1.10`
- `4..6` => `1.20`
- `>=7` => `1.30`

Current Japanese code:

- `<=1` => `1.00`
- `2..3` => `1.15`
- `>=4` => `1.30`

## 18.3 Khac nhau o lapse factor

Test policy:

- `0` => `1.00`
- `1..2` => `0.90`
- `3..4` => `0.75`
- `>=5` => `0.60`

Current Japanese code:

- `<=1` => `1.00`
- `2..4` => `0.85`
- `5..7` => `0.70`
- `>=8` => `0.60`

## 18.4 Khac nhau o quiz factor

Test policy co them:

- `multiple` => `0.90`
- `voicePractice` => `0.95`
- `multipleSentence` => `1.00`
- `fillInBlank` => `1.10`

Current Japanese code:

- khong co `quizFactor` trong `calculateInterval()`
- chi co exception cho `multiCharStrokePractice`

### Ket luan phan nay

Neu hoi:

- **logic SRS tieng Nhat dang chay that su la gi?**

thi cau tra loi la:

- phai theo `JapaneseService.php`

Neu hoi:

- **repo dang huong toi policy nao?**

thi co kha nang team dang huong den policy moi trong `SrsIntervalTest.php`, nhung chua dong bo het vao service tieng Nhat.

---

## 19. Danh gia logic hien tai

### Diem manh

1. Don gian, de hieu
2. De debug
3. De tinh toan bang tay
4. Co ghi nhan su on dinh bang streak
5. Co ghi nhan su bat on bang lapses

### Diem yeu

1. State SRS gan truc tiep vao bang tu vung
2. Khong co review grade nhieu muc
3. Khong co quiz factor cho da so quiz
4. Policy tieng Nhat dang lech voi test policy moi
5. Special case stroke practice tao ra nhanh logic rieng

---

## 20. Tom tat logic hien tai

Neu bo gon lai thanh mot luong:

1. Lay tu den han khi `next_review_at <= now`
2. Nhan ket qua review tu frontend
3. Neu fail:
   - level -1, toi thieu 1
   - streak = 0
   - lapses +1
4. Neu pass:
   - level +1, toi da 9
   - streak +1
   - moi 3 streak giam 1 lapse
5. Tinh interval moi:
   - `baseWait(level) * streakFactor(streak) * lapseFactor(lapses)`
6. Ghi `last_reviewed_at`, `next_review_at`, `last_quiz_type`
7. Ghi `jp_daily_logs` de tinh streak theo ngay

---

## 21. Ket luan

Logic SRS tieng Nhat hien tai la mot custom SRS policy dua tren:

- level
- streak
- lapses

No dang hoat dong theo mo hinh:

- **pass => tang level**
- **fail => giam level**
- **streak => thuong them interval**
- **lapses => phat giam interval**

Va hien tai:

- da co special case cho stroke practice
- da co daily learning streak
- nhung chua dung quiz factor tong quat
- va chua dong bo voi bo test policy moi trong repo

Neu can refactor sau nay, day la logic nen duoc xem la **current production behavior** de migrate an toan.
