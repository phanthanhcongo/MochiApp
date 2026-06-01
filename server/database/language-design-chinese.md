# Language Design - Chinese

Tai lieu nay mo ta thiet ke du lieu chi tiet cho **tieng Trung** trong truong hop sau nay app mo rong them ngon ngu nay.

Pham vi:

- hoc tu vung
- hoc cach doc
- hoc nghia
- hoc cach dung trong cau
- ho tro SRS va quiz

Tieng Trung duoc thiet ke theo huong gan voi Japanese, vi cung thuoc nhom:

- character-based language

Nhung tieng Trung don gian hon Japanese o cho:

- reading thuong duoc bieu dien bang `pinyin`
- khong can doi dong `hiragana` / `romaji`

---

## 1. Ban chat cua tieng Trung trong app nay

Neu chi hoc tu vung, Chinese can 4 lop thong tin chinh:

1. Mat chu Han
2. Cach doc pinyin
3. Nghia
4. Vi du / ngu canh

Neu mo rong sau nay, co the them:

- simplified / traditional
- tone pattern

Nhung phase dau chua can tach qua sau.

---

## 2. `vocabulary_items` luu gi cho Chinese

### Field can dung

| Field | Gia tri cho Chinese |
| :--- | :--- |
| `language_id` | trỏ tới `zh` |
| `text` | mat chu chinh, vi du `吃`, `学校`, `喜欢` |
| `base_text` | dang goc, thuong giong `text` |
| `part_of_speech` | `noun`, `verb`, `adjective`, `expression` |
| `meaning` | nghia chinh |
| `notes` | ghi chu bo sung |
| `level_label` | `HSK1`, `HSK2`... neu can |
| `is_active` | co dang hoc khong |
| `metadata` | thong tin phu |

### Goi y `metadata`

```json
{
  "is_grammar": false,
  "hsk_level": "HSK1",
  "traditional_text": "學校",
  "simplified_text": "学校"
}
```

### Ghi chu

Neu app chi chon mot he chu chinh:

- hoac simplified
- hoac traditional

thi `text` la chu dang chinh, con dang con lai de trong `metadata`.

---

## 3. `vocabulary_pronunciations` luu gi cho Chinese

Bang nay rat quan trong voi Chinese.

### `pronunciation_type` nen dung

- `pinyin`
- `zhuyin` neu can sau nay

### Vi du

#### Tu: `吃`

- `pinyin` -> `chi1`

#### Tu: `学校`

- `pinyin` -> `xue2 xiao4`

### Ghi chu

Phase dau co the chon mot trong 2 cach:

1. luu pinyin kem so tone: `xue2 xiao4`
2. luu pinyin co dau thanh: `xué xiào`

Can chot mot chuan ngay tu dau de quiz typing de xu ly.

---

## 4. `vocabulary_examples` luu gi cho Chinese

Tieng Trung can vi du de hoc:

- word order
- ngu canh dung tu
- cach doc ca cau

### Field can dung

| Field | Gia tri cho Chinese |
| :--- | :--- |
| `example_text` | cau vi du bang tieng Trung |
| `example_translation` | nghia cau |
| `example_pronunciation` | cach doc pinyin cua cau |
| `sort_order` | thu tu hien thi |

### Vi du

#### Tu: `喜欢`

- `example_text` -> `我喜欢学习中文。`
- `example_translation` -> `Toi thich hoc tieng Trung.`
- `example_pronunciation` -> `wo3 xi3 huan1 xue2 xi2 zhong1 wen2`

---

## 5. `review_states` luu gi cho Chinese

Chinese dung state SRS chung:

- `srs_level`
- `lapses`
- `streak`
- `last_reviewed_at`
- `next_review_at`
- `is_learning`

### Ghi chu

Khong can doi state model rieng cho Chinese.

Phan khac biet nam o pronunciation va quiz reading.

---

## 6. `review_logs` luu gi cho Chinese

### `exercise_type` hay gap

- `multiple`
- `multiple_reverse`
- `fillInBlank`
- `multipleSentence`
- `voicePractice`
- `pinyinReadingPractice`
- `hanziMeaningChoice`

### Y nghia

Chinese can them log cho bai:

- nhin Hanzi -> doc pinyin
- nhin Hanzi -> chon nghia

---

## 7. `exercise_templates` nen co gi cho Chinese

Chinese dung bo core va them reading-based quiz.

### Quiz core

- `multiple`
- `multiple_reverse`
- `fillInBlank`
- `multipleSentence`
- `voicePractice`

### Quiz rieng cho Chinese

- `pinyinReadingPractice`
- `hanziMeaningChoice`
- `pinyinTypingPractice` co the them sau

### Muc dich tung quiz

#### `pinyinReadingPractice`

- prompt: Hanzi
- answer: chon pinyin dung

#### `hanziMeaningChoice`

- prompt: Hanzi
- answer: chon nghia dung

#### `pinyinTypingPractice`

- prompt: Hanzi
- answer: go pinyin dung

### Vi du template config

```json
{
  "exercise_type": "pinyinReadingPractice",
  "prompt_mode": "word",
  "answer_mode": "choose_reading",
  "config": {
    "pronunciation_type": "pinyin",
    "distractor_count": 4
  }
}
```

---

## 8. `exercise_attempts` luu gi cho Chinese

Moi lan lam quiz can luu:

- `prompt_text`
- `user_answer`
- `correct_answer`
- `is_correct`

### Vi du 1

- `prompt_text` -> `学校`
- `user_answer` -> `xue2 xiao4`
- `correct_answer` -> `xue2 xiao4`

### Vi du 2

- `prompt_text` -> `喜欢`
- `user_answer` -> `thich`
- `correct_answer` -> `thich`

---

## 9. Muc du lieu toi thieu phai co cho Chinese

Moi tu Chinese toi thieu nen co:

1. `text`
2. `meaning`
3. `pinyin`
4. it nhat 1 example
5. state SRS

Neu muon ho tro song song simplified / traditional, nen them 1 truong trong `metadata`.

---

## 10. Nhung gi chua can giai doan dau

Chua can ngay:

- radical
- stroke count
- decomposition
- chi tiet tone contour
- handwriting stroke order

Nhung phan nay chi can khi app doi sang hoc Hanzi chuyen sau.

---

## 11. Ket luan

Tieng Trung nen duoc thiet ke theo huong:

- `vocabulary_items` giu Hanzi, nghia, tu loai
- `metadata` giu simplified / traditional va HSK neu can
- `vocabulary_pronunciations` giu `pinyin`
- `vocabulary_examples` giu cau vi du va pinyin cau
- `review_states` giu SRS
- `review_logs` giu lich su on
- `exercise_templates` bo sung quiz pinyin reading

Neu sau nay them Chinese, no se di rat tu nhien tren cung bo core dang dung cho Japanese.
