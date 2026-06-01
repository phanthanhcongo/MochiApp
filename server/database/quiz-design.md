# Quiz Design for Multilingual Vocabulary App

Tai lieu nay mo ta thiet ke quiz cho app hoc tu vung da ngon ngu, voi pham vi hien tai:

- English
- German
- Japanese
- tuong lai co the them Chinese

Muc tieu la thiet ke quiz theo huong:

- dung chung duoc toi da
- khong nhan ban logic vo ich
- van ho tro diem khac nhau that su cua tung ngon ngu

---

## 1. Nguyen tac thiet ke

Ban chat app nay la **hoc tu vung**, nen quiz khong can bi day thanh mot he thong qua hoc thuat.

Moi quiz nen kiem tra mot trong cac nhom nang luc sau:

1. Nhan biet mat chu
2. Nhan biet nghia
3. Nhan biet cach doc / phat am
4. Dung tu trong cau
5. Goi lai thong tin ngu phap gan lien voi tu

Tu do, thay vi coi quiz chi la mot string type, nen coi quiz la mot cau hinh gom:

- `quiz_type`
- `prompt_mode`
- `answer_mode`
- `language_scope`
- `config`

---

## 2. Core concept

## `quiz_type`

Ten loai bai.

Vi du:

- `multiple`
- `fillInBlank`
- `voicePractice`
- `multipleSentence`
- `ReadingHiraganaPractice`
- `TypingRomajiPractice`
- `articleChoice`

## `prompt_mode`

Thong tin duoc dua ra de hoi user.

Gia tri goi y:

- `word`
- `meaning`
- `sentence`
- `audio`
- `reading`
- `grammar_hint`

## `answer_mode`

Dang cau tra loi ma he thong mong muon.

Gia tri goi y:

- `choose_meaning`
- `choose_word`
- `choose_reading`
- `type_word`
- `type_reading`
- `type_article`
- `type_plural`
- `speak_word`

## `language_scope`

Pham vi ngon ngu cua quiz:

- `global`: dung chung cho moi ngon ngu
- `language_specific`: chi dung cho 1 ngon ngu
- `family_specific`: dung cho 1 nhom ngon ngu, vi du CJK

## `config`

JSON cau hinh bo sung.

Vi du:

```json
{
  "uses_examples": true,
  "requires_pronunciation_type": "hiragana",
  "distractor_count": 4,
  "accept_free_text": false
}
```

---

## 3. Bang du lieu de ho tro quiz

Tai lieu nay gia dinh DB da co cac bang:

- `languages`
- `vocabulary_items`
- `vocabulary_pronunciations`
- `vocabulary_examples`
- `review_states`
- `review_logs`
- `exercise_templates`
- `exercise_attempts`

### `vocabulary_items`

Dung de lay:

- mat chu cua tu
- nghia chinh
- notes
- metadata nhe theo ngon ngu

### `vocabulary_pronunciations`

Dung de lay:

- IPA cho English / German
- hiragana / romaji cho Japanese
- pinyin cho Chinese sau nay

### `vocabulary_examples`

Dung de lay:

- mau cau
- nghia cau
- cach doc cau neu can

### `exercise_templates`

Dung de dinh nghia quiz type va rule sinh bai.

### `exercise_attempts`

Dung de luu ket qua tung lan lam quiz.

---

## 4. Cac quiz core dung chung cho moi ngon ngu

Day la bo quiz nen co san cho tat ca ngon ngu.

### 4.1 `multiple`

Muc dich:

- kiem tra nhan biet tu -> nghia

Cau hinh:

- `prompt_mode`: `word`
- `answer_mode`: `choose_meaning`
- `language_scope`: `global`

Du lieu can:

- `vocabulary_items.text`
- `vocabulary_items.meaning`

### 4.2 `multiple_reverse`

Muc dich:

- kiem tra nghia -> tu

Cau hinh:

- `prompt_mode`: `meaning`
- `answer_mode`: `choose_word`
- `language_scope`: `global`

Du lieu can:

- `vocabulary_items.meaning`
- `vocabulary_items.text`

### 4.3 `fillInBlank`

Muc dich:

- kiem tra kha nang dat tu vao ngu canh

Cau hinh:

- `prompt_mode`: `sentence`
- `answer_mode`: `type_word`
- `language_scope`: `global`

Du lieu can:

- `vocabulary_examples.example_text`
- dap an la target word

### 4.4 `multipleSentence`

Muc dich:

- kiem tra hieu cau hoac chon tu phu hop trong cau

Cau hinh:

- `prompt_mode`: `sentence`
- `answer_mode`: `choose_meaning` hoac `choose_word`
- `language_scope`: `global`

Du lieu can:

- `vocabulary_examples.example_text`
- `vocabulary_examples.example_translation`

### 4.5 `voicePractice`

Muc dich:

- luyen doc tu hoac cau

Cau hinh:

- `prompt_mode`: `word` hoac `sentence`
- `answer_mode`: `speak_word`
- `language_scope`: `global`

Du lieu can:

- text hien thi
- co the kem pronunciation

---

## 5. English quiz design

English la ngon ngu co cau truc tuong doi nhe. Phan lon quiz co the tai su dung bo core.

## Quiz nen dung

- `multiple`
- `multiple_reverse`
- `fillInBlank`
- `multipleSentence`
- `voicePractice`
- `spelling`

### 5.1 `spelling`

Muc dich:

- nghe / nho nghia roi go dung mat chu

Cau hinh:

- `prompt_mode`: `meaning` hoac `audio`
- `answer_mode`: `type_word`
- `language_scope`: `language_specific`

Du lieu can:

- meaning
- audio hoac pronunciation neu co

### Luu y cho English

English khong can qua nhieu quiz dac thu neu app tap trung vao tu vung.

Neu sau nay can them:

- irregular verb recall
- phrasal verb grouping

thi co the them sau, khong can dua vao phase dau.

---

## 6. German quiz design

German khac English o cho hoc tu thuong phai hoc kem mot goi thong tin ngu phap.

Vi vay German can bo core quiz va them mot vai quiz dac thu.

## Quiz nen dung

- `multiple`
- `multiple_reverse`
- `fillInBlank`
- `multipleSentence`
- `voicePractice`
- `articleChoice`
- `pluralChoice`
- `verbFormChoice`

### 6.1 `articleChoice`

Muc dich:

- chon dung article cho danh tu

Cau hinh:

- `prompt_mode`: `word`
- `answer_mode`: `type_article` hoac `choose_word`
- `language_scope`: `language_specific`

Du lieu can:

- target noun
- article trong `metadata` hoac field rieng

Vi du lua chon:

- `der`
- `die`
- `das`

### 6.2 `pluralChoice`

Muc dich:

- nho hinh thuc so nhieu cua danh tu

Cau hinh:

- `prompt_mode`: `word`
- `answer_mode`: `choose_word`
- `language_scope`: `language_specific`

Du lieu can:

- singular form
- plural form

### 6.3 `verbFormChoice`

Muc dich:

- chon dang chia co ban dung cho dong tu

Cau hinh:

- `prompt_mode`: `grammar_hint`
- `answer_mode`: `choose_word`
- `language_scope`: `language_specific`

Du lieu can:

- infinitive
- chu ngu / ngu canh ngan
- dap an chia dung

### Luu y cho German

Neu app chu yeu hoc tu vung co ban, `articleChoice` la quiz quan trong nhat can them som.

`pluralChoice` dung thu 2.

`verbFormChoice` co the de phase sau neu chua can gap.

---

## 7. Japanese quiz design

Japanese khac manh vi can tach:

- mat chu
- cach doc
- nghia
- ngu canh dung

Day la ly do Japanese can quiz rieng ve reading.

## Quiz nen dung

- `multiple`
- `multiple_reverse`
- `fillInBlank`
- `multipleSentence`
- `voicePractice`
- `ReadingHiraganaPractice`
- `TypingRomajiPractice`
- `kanaToWordChoice`

### 7.1 `ReadingHiraganaPractice`

Muc dich:

- tu mat chu / kanji chon cach doc hiragana dung

Cau hinh:

- `prompt_mode`: `word`
- `answer_mode`: `choose_reading`
- `language_scope`: `language_specific`

Du lieu can:

- `vocabulary_items.text`
- pronunciation type `hiragana`

### 7.2 `TypingRomajiPractice`

Muc dich:

- tu mat chu / kana go ra romaji

Cau hinh:

- `prompt_mode`: `word`
- `answer_mode`: `type_reading`
- `language_scope`: `language_specific`

Du lieu can:

- pronunciation type `romaji`

### 7.3 `kanaToWordChoice`

Muc dich:

- tu hiragana chon tu / kanji dung

Cau hinh:

- `prompt_mode`: `reading`
- `answer_mode`: `choose_word`
- `language_scope`: `language_specific`

Du lieu can:

- prompt la pronunciation hiragana
- dap an la `vocabulary_items.text`

### Luu y cho Japanese

Neu app tap trung vao hoc tu, 2 quiz quan trong nhat ngoai bo core la:

- `ReadingHiraganaPractice`
- `TypingRomajiPractice`

Khong can di qua sau vao stroke order neu chua hoc kanji theo huong viet chu.

---

## 8. Chinese quiz design trong tuong lai

Chinese sau nay co the di rat gan Japanese o nhom quiz reading.

## Quiz nen dung

- `multiple`
- `multiple_reverse`
- `fillInBlank`
- `multipleSentence`
- `voicePractice`
- `pinyinReadingPractice`
- `hanziMeaningChoice`

### 8.1 `pinyinReadingPractice`

Muc dich:

- tu hanzi chon / go pinyin dung

Cau hinh:

- `prompt_mode`: `word`
- `answer_mode`: `choose_reading` hoac `type_reading`
- `language_scope`: `language_specific`

Du lieu can:

- pronunciation type `pinyin`

---

## 9. Bo quiz toi uu de trien khai

Neu uu tien tinh gon va dung du cho hien tai, nen chia thanh 3 tang.

## Tang 1 - must have

- `multiple`
- `multiple_reverse`
- `fillInBlank`
- `multipleSentence`
- `voicePractice`

Tang nay dung chung cho English, German, Japanese.

## Tang 2 - language-specific can co som

- German: `articleChoice`
- Japanese: `ReadingHiraganaPractice`
- Japanese: `TypingRomajiPractice`

## Tang 3 - co the them sau

- English: `spelling`
- German: `pluralChoice`
- German: `verbFormChoice`
- Japanese: `kanaToWordChoice`
- Chinese: `pinyinReadingPractice`

---

## 10. Mapping voi quiz type hien tai

He thong hien tai dang co:

```ts
export type QuizType = 'multiple' | 'fillInBlank' | 'voicePractice' | 'multipleSentence';
export type QuizType_withoutStroke = 'multiple' | 'ReadingHiraganaPractice' | 'TypingRomajiPractice' | 'voicePractice';
```

Mapping nhu sau:

| Quiz hien tai | Nhom | Co giu lai khong | Ghi chu |
| :--- | :--- | :--- | :--- |
| `multiple` | Core | Co | Dung chung moi ngon ngu |
| `fillInBlank` | Core | Co | Dung theo example sentence |
| `voicePractice` | Core | Co | Dung chung moi ngon ngu |
| `multipleSentence` | Core | Co | Dung sentence context |
| `ReadingHiraganaPractice` | Japanese | Co | Bai reading dac thu |
| `TypingRomajiPractice` | Japanese | Co | Bai go romaji dac thu |

Ket luan: bo quiz hien tai **hoan toan phu hop** voi huong schema gon cho app hoc tu vung.

Chi can them sau neu can:

- `articleChoice` cho German
- `spelling` cho English
- `pinyinReadingPractice` cho Chinese

---

## 11. Goi y luu trong `exercise_templates`

Moi quiz nen duoc dinh nghia nhu mot template.

Cot goi y:

- `id`
- `language_id` nullable
- `exercise_type`
- `name`
- `prompt_mode`
- `answer_mode`
- `config jsonb`
- `is_active`
- `created_at`
- `updated_at`

### Vi du template dung chung

```json
{
  "exercise_type": "multiple",
  "prompt_mode": "word",
  "answer_mode": "choose_meaning",
  "config": {
    "distractor_count": 4
  }
}
```

### Vi du template cho Japanese

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

### Vi du template cho German

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

## 12. Ket luan

Huong thiet ke quiz toi uu cho app nay la:

- giu mot bo quiz core dung chung cho moi ngon ngu
- them mot so quiz dac thu nho cho German va Japanese
- khi them Chinese thi di tiep nhanh CJK reading pattern

Neu gioi han bai toan la **hoc tu vung**, thi khong can thiet ke quiz qua phuc tap.

Chi can dam bao moi ngon ngu deu duoc phu 4 muc tieu:

1. biet mat chu
2. biet nghia
3. biet cach doc
4. biet cach dung trong cau

German bo sung:

5. nho article / hinh thai co ban

Japanese bo sung:

5. nho reading

Chinese trong tuong lai bo sung:

5. nho pinyin / reading
