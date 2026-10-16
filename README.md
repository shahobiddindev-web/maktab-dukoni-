# 📚 Zukko — Maktab Do'koni Mahsulotlar Katalogi va Narxlar Ro'yxati

Zamonaviy, qulay va to'liq interaktiv **Maktab do'koni** veb-katalogi. Ushbu loyiha maktab o'quvchilari, ota-onalar va o'qituvchilar uchun barcha o'quv qurollari ro'yxatini real narxlari, kategoriyalari va zaxirasi bilan taqdim etadi.

---

## 🌟 Asosiy Imkoniyatlar

1. **Mahsulotlar katalogi**:
   - Daftarlar, ruchkalar, rasm va san'at to'plamlari, geometriya asboblari, maktab sumkalari, kundaliklar, lanch-bokslar va suv idishlari.
   - Har bir mahsulot bo'yicha: Artikul kodi, nomi, fotosurati, tavsifi, bahosi (yulduzchalar), o'lchov birligi, ombordagi qoldiq soni, rasmiy narxi va chegirmalari.

2. **Ko'rinish rejimlari (Grid va Jadval)**:
   - **Kartalar (Grid)**: Chiroyli vizual kartalar, rasmlar, aksiyalar va tezkor savatchaga qo'shish.
   - **Jadval (Table / Narxnoma)**: Maktab ma'muriyati yoki hisobchilar uchun qulay narxlar jadvali.

3. **Filtrlash va Saralash**:
   - Kategoriyalar bo'yicha alohida ko'rish (har bir kategoriya bo'yicha mahsulotlar soni ko'rsatiladi).
   - Jonli qidiruv (mahsulot nomi, artikul kodi yoki tavsif bo'yicha).
   - Narx oralig'i (narx slayderi orqali cheklash).
   - "Faqat sotuvda borlari" filtri.
   - Saralash: Tavsiya etilgan, Narx: arzondan qimmatga, Narx: qimmatdan arzonga, A-Z, Reyting bo'yicha.

4. **Interaktiv Savatcha va Buyurtma**:
   - Mahsulot miqdorini oshirish/kamaytirish (+ / -).
   - Chegirmalar va tejalgan mablag'ni avtomatik hisoblash.
   - Sinfga yetkazish yoki do'kondan olib ketish tanlovi.
   - Telegram orqali barcha buyurtma tafsilotlari bilan xabar jo'natish yoki nusxalash.

5. **Rasmiy Narxnoma (A4 Chop etish)**:
   - "Narxnoma (Chop etish)" tugmasi orqali umumiy tovarlar ro'yxatini A4 formatida pechat va imzo qo'yish uchun tayyor qilib chiqarish.

6. **Yangi mahsulot qo'shish va Lokal Xotira (LocalStorage)**:
   - Do'kondor o'z mahsulotlarini kiritishi mumkin.
   - Barcha ma'lumotlar brauzer xotirasida saqlanadi.
   - "Katalogni qayta tiklash" tugmasi orqali istalgan paytda standart ro'yxatga qaytish mumkin.

---

## 📂 Fayllar Strukturasi

```
e:\SAYT LAR\DUKON\
│
├── index.html        # Asosiy HTML sahifa (Katalog, modallar, savatcha)
├── style.css         # Maxsus dizayn uslublari, chop etish (print) qoidalari
├── app.js            # Interaktiv logika, filtrlar, savatcha, buyurtmalar
├── products.js       # Standart mahsulotlar bazasi (24+ xil tovar)
└── README.md         # Foydalanish qo'llanmasi
```

---

## 🚀 Ishga tushirish

Hech qanday qo'shimcha server yoki kutubxona o'rnatish talab etilmaydi.
Oddiygina `index.html` faylini istalgan brauzerda (Chrome, Edge, Firefox, Opera) oching.
