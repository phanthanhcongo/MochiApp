# Language Design - German

Tai lieu nay mo ta thiet ke du lieu chi tiet cho **tieng Duc** trong app hoc tu vung da ngon ngu.

Pham vi:

- hoc tu vung
- hoc nghia
- hoc phat am
- hoc cach dung trong cau
- hoc kem mot phan grammar package can thiet

Tieng Duc khac English o cho:

- mot tu thuong can hoc kem article
- danh tu can hoc kem plural
- nhieu tu co hinh thai can nho kem

Vi vay German khong phuc tap nhu Japanese ve reading, nhung phuc tap hon English ve thong tin ngu phap dinh kem.

---

## 1. Ban chat cua tieng Duc trong app nay

Voi German, hoc tu vung thuc te thuong la hoc:

1. Mat chu
2. Nghia
3. Pronunciation
4. Vi du
5. Grammar package nho

Grammar package nho o day chu yeu la:

- article
- plural form

Neu khong luu 2 thong tin nay, hoc tu Duc se bi thieu.

---

## 2. `vocabulary_items` luu gi cho German

### Field can dung

| Field | Gia tri cho German |
| :--- | :--- |
| `language_id` | trỏ tới `de` |
| `text` | mat chu chinh, vi du `Haus`, `gehen`, `schnell` |
| `base_text` | dang goc |
| `part_of_speech` | `noun`, `verb`, `adjective`, `phrase` |
| `meaning` | nghia chinh |
| `notes` | ghi chu cach dung |
| `level_label` | `A1`, `A2`, `B1`... |
| `is_active` | co dang hoc khong |
| `metadata` | grammar package va thong tin phu |

### Goi y `metadata`

```json
{
  "is_grammar": false,
  "article": "das",
  "plural_form": "Hauser",
  "irregular": false
}
```

### Ghi chu

Voi German giai doan dau, `metadata` la du de luu:

- `article`
- `plural_form`

Neu sau nay can query, filter va bao cao nhieu theo 2 field nay, khi do moi can tach rieng.

---

## 3. `vocabulary_pronunciations` luu gi cho German

German chu yeu can:

- `ipa`
- `phonetic_note` neu can

### Vi du

#### Tu: `Haus`

- `ipa` -> `/haʊ̯s/`

#### Tu: `ich`

- `ipa` -> `/ɪç/`

### Y nghia

Bang nay ho tro:

- phat am
- voice practice
- nhan biet cach doc chuan

---

## 4. `vocabulary_examples` luu gi cho German

Tieng Duc can vi du de hoc:

- vi tri tu trong cau
- article usage
- plural usage

### Field can dung

| Field | Gia tri cho German |
| :--- | :--- |
| `example_text` | cau vi du bang tieng Duc |
| `example_translation` | nghia cau |
| `example_pronunciation` | thuong co the de trong |
| `sort_order` | thu tu hien thi |

### Vi du

#### Tu: `Haus`

- `example_text` -> `Das Haus ist sehr alt.`
- `example_translation` -> `Can nha do rat cu.`

---

## 5. `review_states` luu gi cho German

German dung cung state SRS chung:

- `srs_level`
- `lapses`
- `streak`
- `last_reviewed_at`
- `next_review_at`
- `is_learning`

### Ghi chu

Phan state khong can khac rieng.

Su khac biet cua German nam o quiz va metadata, khong nam o co che luu SRS.

---

## 6. `review_logs` luu gi cho German

### `exercise_type` hay gap

- `multiple`
- `multiple_reverse`
- `fillInBlank`
- `multipleSentence`
- `voicePractice`
- `articleChoice`
- `pluralChoice`

### Y nghia

German can track them nhung bai:

- chon article
- nho plural

Day la diem khac biet lon nhat voi English.

---

## 7. `exercise_templates` nen co gi cho German

German dung core quiz va them quiz grammar package.

### Quiz core

- `multiple`
- `multiple_reverse`
- `fillInBlank`
- `multipleSentence`
- `voicePractice`

### Quiz rieng cho German

- `articleChoice`
- `pluralChoice`
- `verbFormChoice` co the them sau

### Muc dich tung quiz

#### `articleChoice`

- prompt: word
- answer: chon `der`, `die`, `das`

#### `pluralChoice`

- prompt: singular noun
- answer: chon plural form dung

#### `verbFormChoice`

- prompt: chu ngu + dong tu goc
- answer: chon dang chia dung

### Vi du template config

```json
{
  "exercise_type": "articleChoice",
  "prompt_mode": "word",
  "answer_mode": "type_article",
  "config": {
    "allowed_answers": ["der", "die", "das"]
  }
}
```

---

## 8. `exercise_attempts` luu gi cho German

Moi lan lam quiz can luu:

- `prompt_text`
- `user_answer`
- `correct_answer`
- `is_correct`

### Vi du 1

- `prompt_text` -> `Haus`
- `user_answer` -> `das`
- `correct_answer` -> `das`

### Vi du 2

- `prompt_text` -> `Mann`
- `user_answer` -> `Manner`
- `correct_answer` -> `Manner`

---

## 9. Muc du lieu toi thieu phai co cho German

Moi tu German toi thieu nen co:

1. `text`
2. `meaning`
3. `part_of_speech`
4. neu la noun thi nen co `article`
5. neu la noun thi nen co `plural_form`
6. neu co the thi co `ipa`
7. it nhat 1 example

Neu bo qua `article` va `plural_form`, viec hoc danh tu German se rat yeu.

---

## 10. Nhung gi chua can giai doan dau

Chua can tach rieng ngay:

- full declension tables
- adjective inflection tables
- separable prefix data chi tiet
- case transformation matrix

Nhung phan nay chi can khi app di sau vao grammar, khong con la hoc tu vung co ban nua.

---

## 11. Ket luan

Tieng Duc nen luu theo huong:

- `vocabulary_items` giu word, meaning, part_of_speech
- `metadata` giu `article` va `plural_form`
- `vocabulary_pronunciations` giu `ipa`
- `vocabulary_examples` giu sentence va translation
- `review_states` giu SRS
- `review_logs` giu lich su on
- `exercise_templates` bo sung `articleChoice` va `pluralChoice`

Day la muc can bang tot giua hoc tu vung va grammar package co ban cua German.
