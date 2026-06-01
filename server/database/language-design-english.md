# Language Design - English

Tai lieu nay mo ta thiet ke du lieu chi tiet cho **tieng Anh** trong app hoc tu vung da ngon ngu.

Pham vi:

- hoc tu vung
- hoc nghia
- hoc phat am
- hoc cach dung trong cau
- ho tro SRS va quiz

Tieng Anh la ngon ngu de nhat trong 4 ngon ngu ve mat mo hinh du lieu, vi:

- mat chu va pronunciation gan nhau hon Japanese
- grammar package gan voi tu nhe hon German

---

## 1. Ban chat cua tieng Anh trong app nay

Neu chi hoc tu vung, English chu yeu can:

1. Mat chu
2. Nghia
3. Pronunciation
4. Vi du trong cau

Phan lon logic co the dung bo core ma khong can bang phu rieng.

---

## 2. `vocabulary_items` luu gi cho English

### Field can dung

| Field | Gia tri cho English |
| :--- | :--- |
| `language_id` | trỏ tới `en` |
| `text` | mat chu chinh, vi du `apple`, `run`, `careful` |
| `base_text` | dang goc, thuong giong `text` |
| `part_of_speech` | `noun`, `verb`, `adjective`, `adverb`, `phrase` |
| `meaning` | nghia chinh |
| `notes` | ghi chu cach dung |
| `level_label` | `A1`, `A2`, `B1`... neu can |
| `is_active` | co dang hoc khong |
| `metadata` | thong tin phu |

### Goi y `metadata`

```json
{
  "is_grammar": false,
  "cefr_level": "A1",
  "countability": "countable",
  "irregular": false
}
```

### Ghi chu

Voi English, `metadata` co the du cho phase dau.

Neu sau nay can hoc ky hon, moi tach them thong tin:

- irregular past
- past participle
- phrasal verb group

---

## 3. `vocabulary_pronunciations` luu gi cho English

English chu yeu can:

- `ipa`
- `phonetic_note` neu can

### Vi du

#### Tu: `apple`

- `ipa` -> `/ˈæp.əl/`

#### Tu: `thought`

- `ipa` -> `/θɔːt/`

### Y nghia

Bang nay giup:

- hien pronunciation
- ho tro voice practice
- co the sinh bai spelling / listening sau nay

---

## 4. `vocabulary_examples` luu gi cho English

Tieng Anh rat can example de hoc collocation va cach dat tu vao cau.

### Field can dung

| Field | Gia tri cho English |
| :--- | :--- |
| `example_text` | cau vi du bang tieng Anh |
| `example_translation` | nghia cau bang tieng Viet hoac ngon ngu UI |
| `example_pronunciation` | thuong co the de trong |
| `sort_order` | thu tu hien thi |

### Vi du

#### Tu: `careful`

- `example_text` -> `Be careful when you cross the street.`
- `example_translation` -> `Hay can than khi ban bang qua duong.`

### Ghi chu

English thuong khong can `example_pronunciation`, nhung van co the de trong schema cho dong bo voi cac ngon ngu khac.

---

## 5. `review_states` luu gi cho English

English dung cung mo hinh SRS chung:

- `srs_level`
- `lapses`
- `streak`
- `last_reviewed_at`
- `next_review_at`
- `is_learning`

### Y nghia

Khong co khac biet dac thu so voi core.

Neu app da co policy SRS chung thi English la ngon ngu de dung nhat.

---

## 6. `review_logs` luu gi cho English

Bang nay luu lich su tung lan review.

### `exercise_type` hay gap

- `multiple`
- `multiple_reverse`
- `fillInBlank`
- `multipleSentence`
- `voicePractice`
- `spelling` neu them sau

### Muc dich

- thong ke progress
- phan tich tu hay sai
- danh gia quiz nao hieu qua

---

## 7. `exercise_templates` nen co gi cho English

English chu yeu dung bo core.

### Quiz nen co

- `multiple`
- `multiple_reverse`
- `fillInBlank`
- `multipleSentence`
- `voicePractice`
- `spelling` co the them sau

### Muc dich tung quiz

#### `multiple`

- prompt: word
- answer: choose meaning

#### `multiple_reverse`

- prompt: meaning
- answer: choose word

#### `fillInBlank`

- prompt: sentence
- answer: type word

#### `multipleSentence`

- prompt: sentence
- answer: choose word hoac choose meaning

#### `voicePractice`

- prompt: word hoac sentence
- answer: speak

#### `spelling`

- prompt: meaning hoac audio
- answer: type word

---

## 8. `exercise_attempts` luu gi cho English

Moi lan lam quiz can luu:

- `prompt_text`
- `user_answer`
- `correct_answer`
- `is_correct`

### Vi du 1

- `prompt_text` -> `apple`
- `user_answer` -> `qua tao`
- `correct_answer` -> `qua tao`

### Vi du 2

- `prompt_text` -> `Be careful when you cross the street.`
- `user_answer` -> `careful`
- `correct_answer` -> `careful`

---

## 9. Muc du lieu toi thieu phai co cho English

Moi tu English toi thieu nen co:

1. `text`
2. `meaning`
3. neu co the thi co `ipa`
4. it nhat 1 example
5. state SRS

Neu bo qua `ipa` van hoc duoc, nhung trai nghiem pronunciation se yeu di.

---

## 10. Nhung gi co the them sau

Neu sau nay app hoc tieng Anh ky hon, co the them:

- irregular verb info
- countable / uncountable
- phrasal verb grouping
- collocation tags

Nhung o giai doan hoc tu vung co ban, chua can tang do phuc tap len som.

---

## 11. Ket luan

Tieng Anh la ngon ngu phu hop nhat voi core schema.

Nen luu theo huong:

- `vocabulary_items` giu word, meaning, part_of_speech
- `vocabulary_pronunciations` giu `ipa`
- `vocabulary_examples` giu sentence va translation
- `review_states` giu SRS
- `review_logs` giu lich su on
- `exercise_templates` chu yeu dung core quiz

English nen la ngon ngu mau de thiet ke va on dinh truoc khi mo rong sang cac ngon ngu phuc tap hon.
