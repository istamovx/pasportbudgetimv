/* ==========================================================================
   O'zbekiston Respublikasi viloyatlari va tumanlari (viloyat -> tumanlar).
   Cascading select uchun ma'lumot manbai.
   ========================================================================== */
(function (global) {
  "use strict";
  global.UZB_REGIONS = {
    "Toshkent shahri": ["Bektemir", "Chilonzor", "Yashnobod", "Mirobod", "Mirzo Ulug‘bek", "Sergeli", "Shayxontohur", "Olmazor", "Uchtepa", "Yakkasaroy", "Yunusobod", "Yangihayot"],
    "Toshkent viloyati": ["Bekobod", "Bo‘ka", "Bo‘stonliq", "Chinoz", "Qibray", "Ohangaron", "Oqqo‘rg‘on", "Parkent", "Piskent", "Quyichirchiq", "O‘rtachirchiq", "Yangiyo‘l", "Yuqorichirchiq", "Zangiota", "Toshkent tumani", "Ohangaron shahri", "Angren", "Chirchiq", "Nurafshon"],
    "Andijon viloyati": ["Andijon", "Asaka", "Baliqchi", "Bo‘ston", "Buloqboshi", "Izboskan", "Jalaquduq", "Marhamat", "Oltinko‘l", "Paxtaobod", "Qo‘rg‘ontepa", "Shahrixon", "Ulug‘nor", "Xo‘jaobod", "Andijon shahri", "Xonobod"],
    "Farg‘ona viloyati": ["Beshariq", "Bog‘dod", "Buvayda", "Dang‘ara", "Farg‘ona tumani", "Furqat", "Qo‘shtepa", "Rishton", "So‘x", "Toshloq", "Uchko‘prik", "O‘zbekiston", "Yozyovon", "Oltiariq", "Quva", "Marg‘ilon", "Farg‘ona shahri", "Qo‘qon", "Quvasoy"],
    "Namangan viloyati": ["Chortoq", "Chust", "Kosonsoy", "Mingbuloq", "Namangan tumani", "Norin", "Pop", "To‘raqo‘rg‘on", "Uchqo‘rg‘on", "Uychi", "Yangiqo‘rg‘on", "Namangan shahri"],
    "Samarqand viloyati": ["Bulung‘ur", "Ishtixon", "Jomboy", "Kattaqo‘rg‘on tumani", "Narpay", "Nurobod", "Oqdaryo", "Past darg‘om", "Paxtachi", "Payariq", "Qo‘shrabot", "Samarqand tumani", "Toyloq", "Urgut", "Samarqand shahri", "Kattaqo‘rg‘on shahri"],
    "Buxoro viloyati": ["Buxoro tumani", "G‘ijduvon", "Jondor", "Kogon tumani", "Olot", "Peshku", "Qorako‘l", "Qorovulbozor", "Romitan", "Shofirkon", "Vobkent", "Buxoro shahri", "Kogon shahri"],
    "Xorazm viloyati": ["Bog‘ot", "Gurlan", "Hazorasp", "Xonqa", "Qo‘shko‘pir", "Shovot", "Urganch tumani", "Xiva tumani", "Yangiariq", "Yangibozor", "Tuproqqal’a", "Urganch shahri", "Xiva shahri"],
    "Qashqadaryo viloyati": ["Chiroqchi", "Dehqonobod", "G‘uzor", "Kasbi", "Kitob", "Koson", "Mirishkor", "Muborak", "Nishon", "Qamashi", "Qarshi tumani", "Shahrisabz tumani", "Yakkabog‘", "Ko‘kdala", "Qarshi shahri", "Shahrisabz shahri"],
    "Surxondaryo viloyati": ["Angor", "Boysun", "Denov", "Jarqo‘rg‘on", "Muzrabot", "Oltinsoy", "Qiziriq", "Qumqo‘rg‘on", "Sariosiyo", "Sherobod", "Sho‘rchi", "Termiz tumani", "Uzun", "Bandixon", "Termiz shahri"],
    "Jizzax viloyati": ["Arnasoy", "Baxmal", "Do‘stlik", "Forish", "G‘allaorol", "Sharof Rashidov", "Mirzacho‘l", "Paxtakor", "Yangiobod", "Zafarobod", "Zarbdor", "Zomin", "Jizzax shahri"],
    "Sirdaryo viloyati": ["Boyovut", "Guliston tumani", "Mirzaobod", "Oqoltin", "Sardoba", "Sayxunobod", "Sirdaryo tumani", "Xovos", "Shirin", "Yangiyer", "Guliston shahri"],
    "Navoiy viloyati": ["Konimex", "Karmana", "Navbahor", "Nurota", "Qiziltepa", "Tomdi", "Uchquduq", "Xatirchi", "Navoiy tumani", "Zarafshon", "Navoiy shahri"],
    "Qoraqalpog‘iston Respublikasi": ["Amudaryo", "Beruniy", "Chimboy", "Ellikqal’a", "Kegayli", "Mo‘ynoq", "Nukus tumani", "Qanliko‘l", "Qo‘ng‘irot", "Qorao‘zak", "Shumanay", "Taxtako‘pir", "To‘rtko‘l", "Xo‘jayli", "Nukus shahri"]
  };
  global.UZB_VILOYATLAR = Object.keys(global.UZB_REGIONS);
})(window);
