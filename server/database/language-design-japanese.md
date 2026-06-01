# Language Design - Japanese

Tai lieu nay mo ta thiet ke du lieu chi tiet cho **tieng Nhat** trong app hoc tu vung da ngon ngu.

Pham vi cua tai lieu:

- hoc tu vung
- hoc cach doc
- hoc nghia
- hoc cach dung trong cau
- ho tro SRS va quiz hien tai

Tai lieu nay khong di qua sau vao hoc Kanji chuyen sau nhu:

- bo thu
- stroke count
- onyomi / kunyomi theo cap ky tu
- decomposition

Neu sau nay can hoc Kanji chuyen sau, do se la phase tiep theo.

---

## 1. Ban chat cua tieng Nhat trong app nay

Neu nhin tu goc do hoc tu vung, tieng Nhat can 4 lop thong tin chinh:

1. Mat chu
2. Cach doc
3. Nghia
4. Vi du / ngu canh

Khac biet lon nhat cua tieng Nhat so voi English la:

- mat chu va cach doc khong trung nhau
- user can hoc ca word recognition va reading recognition

Vi vay schema cho Japanese phai uu tien:

- `text`
- `hiragana`
- `romaji`
- `example_text`
- `example_pronunciation`

---

## 2. `vocabulary_items` luu gi cho Japanese

Day la bang trung tam.

Moi record thuong la:

- mot tu
- mot cum tu
- mot expression
- mot mau ngu phap ngan

### Field can dung

| Field | Gia tri cho Japanese |
| :--- | :--- |
| `language_id` | trỏ tới `ja` |
| `text` | mat chu chinh, vi du `食べる`, `学校`, `大丈夫` |
| `base_text` | dang goc, thuong giong `text` |
| `part_of_speech` | `verb`, `noun`, `i_adjective`, `na_adjective`, `expression`, `grammar` |
| `meaning` | nghia chinh bang ngon ngu hoc vien muon xem, vi du tieng Viet |
| `notes` | ghi chu bo sung |
| `level_label` | `N5`, `N4`, `N3`... |
| `is_active` | co dang hoc khong |
| `metadata` | chua thong tin phu |

### Goi y `metadata`

```json
{
  "is_grammar": false,
  "jlpt_level": "N5",
  "verb_group": "ichidan",
  "keigo": false
}
```

### Ghi chu

`metadata` chi nen chua thong tin nhe:

- `verb_group`
- `jlpt_level`
- `is_grammar`

Khong nen nhet qua nhieu du lieu hoc Kanji chuyen sau vao day.

---

## 3. `vocabulary_pronunciations` luu gi cho Japanese

Day la bang rat quan trong voi Japanese.

Mot tu co the co nhieu kieu pronunciation.

### Cac `pronunciation_type` nen dung

- `hiragana`
- `romaji`
- `katakana` neu can

### Vi du

#### Tu: `食べる`

- `hiragana` -> `たべる`
- `romaji` -> `taberu`

#### Tu: `学校`

- `hiragana` -> `がっこう`
- `romaji` -> `gakkou`

### Y nghia

- `hiragana` phuc vu quiz reading
- `romaji` phuc vu quiz typing

### Chua can ngay

Chua can luu ngay:

- `onyomi`
- `kunyomi`
- `pitch_accent`

tru khi app chuyen huong sang hoc Kanji nang hon.

---

## 4. `vocabulary_examples` luu gi cho Japanese

Tieng Nhat can vi du rat ro vi mot tu co the thay doi sac thai theo ngu canh.

### Field can dung

| Field | Gia tri cho Japanese |
| :--- | :--- |
| `example_text` | cau goc tieng Nhat |
| `example_translation` | nghia cau |
| `example_pronunciation` | cach doc cua cau, thuong la hiragana |
| `sort_order` | thu tu hien thi |

### Vi du

#### Tu: `食べる`

- `example_text` -> `毎朝パンを食べる。`
- `example_translation` -> `Toi an banh mi moi sang.`
- `example_pronunciation` -> `まいあさ ぱん を たべる。`

### Y nghia

Bang nay giup:

- hoc tu trong cau
- sinh quiz `fillInBlank`
- sinh quiz `multipleSentence`

---

## 5. `review_states` luu gi cho Japanese

Day la state SRS hien tai cua user voi tung tu.

### Field can dung

| Field | Y nghia |
| :--- | :--- |
| `user_id` | user dang hoc |
| `vocabulary_item_id` | tu dang hoc |
| `srs_level` | muc do nho hien tai |
| `lapses` | so lan quen |
| `streak` | so lan dung lien tiep |
| `last_reviewed_at` | lan on gan nhat |
| `next_review_at` | lan on tiep theo |
| `is_learning` | co dang theo hoc tu nay khong |

### Mapping voi logic cu

Neu doi tu `jp_words` hien tai sang schema moi:

- `level` -> `srs_level`
- `lapses` -> `lapses`
- `streak` -> `streak`
- `last_reviewed_at` -> `last_reviewed_at`
- `next_review_at` -> `next_review_at`

---

## 6. `review_logs` luu gi cho Japanese

Bang nay luu tung lan review de thong ke va phan tich.

### Field can dung

| Field | Y nghia |
| :--- | :--- |
| `user_id` | ai vua review |
| `vocabulary_item_id` | tu nao duoc review |
| `exercise_type` | quiz nao da dung |
| `result` | dung / sai |
| `reviewed_at` | thoi diem review |
| `response_time_ms` | toc do tra loi |

### `exercise_type` hay gap

- `multiple`
- `fillInBlank`
- `voicePractice`
- `multipleSentence`
- `ReadingHiraganaPractice`
- `TypingRomajiPractice`

---

## 7. `exercise_templates` nen co gi cho Japanese

Tieng Nhat dung bo quiz chung va them quiz reading rieng.

### Quiz core dung duoc

- `multiple`
- `multiple_reverse`
- `fillInBlank`
- `multipleSentence`
- `voicePractice`

### Quiz rieng cho Japanese

- `ReadingHiraganaPractice`
- `TypingRomajiPractice`
- `kanaToWordChoice`

### Muc dich tung quiz

#### `ReadingHiraganaPractice`

- prompt: mat chu
- answer: chon hiragana dung

#### `TypingRomajiPractice`

- prompt: mat chu
- answer: go romaji dung

#### `kanaToWordChoice`

- prompt: hiragana
- answer: chon mat chu dung

### Vi du template config

```json
{
  "exercise_type": "ReadingHiraganaPractice",
  "prompt_mode": "word",
  "answer_mode": "choose_reading",
  "config": {
    "pronunciation_type": "hiragana",
    "distractor_count": 4
  }
}
```

---

## 8. `exercise_attempts` luu gi cho Japanese

Moi lan user lam quiz, can luu:

- `prompt_text`
- `user_answer`
- `correct_answer`
- `is_correct`

### Vi du 1

- `prompt_text` -> `食べる`
- `user_answer` -> `たべる`
- `correct_answer` -> `たべる`

### Vi du 2

- `prompt_text` -> `がっこう`
- `user_answer` -> `学校`
- `correct_answer` -> `学校`

---

## 9. Muc du lieu toi thieu phai co cho Japanese

Neu chi tap trung vao hoc tu vung, moi tu Japanese toi thieu nen co:

1. `text`
2. `meaning`
3. `hiragana`
4. `romaji`
5. it nhat 1 example
6. `srs_level`, `lapses`, `streak`

Neu thieu `hiragana`, quiz reading se gay.

Neu thieu `example_text`, quiz sentence se rat yeu.

---

## 10. Nhung gi chua can giai doan dau

Chua can thiet ke rieng cho:

- `stroke_order`
- `kanji_components`
- `radical`
- `pitch_accent`
- `furigana token-level`

Cac phan nay chi can khi app di tu hoc tu vung sang hoc Kanji chuyen sau.

---

## 11. Ket luan

Tieng Nhat trong app nay nen luu theo huong:

- `vocabulary_items` giu mat chu, nghia, tu loai
- `vocabulary_pronunciations` giu `hiragana` va `romaji`
- `vocabulary_examples` giu cau vi du va cach doc cau
- `review_states` giu SRS
- `review_logs` giu lich su on
- `exercise_templates` giu quiz doc va quiz dung cau

Neu giu pham vi la hoc tu vung, day la bo du lieu vua gon vua dung cho Japanese.
