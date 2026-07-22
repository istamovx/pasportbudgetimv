/* ==========================================================================
   Administrator roli uchun mock ma'lumotlar:
   klassifikatorlar, foydalanuvchilar, sohalar/yo'nalishlar, konstruktor,
   so'rovlar jurnali. Real API keyin shu shakllarga ulanadi.
   ========================================================================== */
(function (global) {
  "use strict";

  /* ---- Viloyatlar (SOATO) ---- */
  var VILOYAT_SOATO = [
    ["Toshkent shahri", "1726"], ["Toshkent viloyati", "1727"], ["Sirdaryo viloyati", "1724"],
    ["Namangan viloyati", "1714"], ["Samarqand viloyati", "1718"], ["Qoraqalpog‘iston Respublikasi", "1735"],
    ["Andijon viloyati", "1703"], ["Surxondaryo viloyati", "1722"], ["Qashqadaryo viloyati", "1710"],
    ["Navoiy viloyati", "1712"], ["Jizzax viloyati", "1708"], ["Farg‘ona viloyati", "1730"],
    ["Buxoro viloyati", "1706"], ["Xorazm viloyati", "1733"]
  ];

  function rows1(list) { return list.map(function (n) { return { name: n }; }); }

  /* ---- Klassifikatorlar: guruh -> lug'atlar -> qatorlar ---- */
  var CLASSIFIERS = [
    {
      id: "hudud", label: "Hududlar", items: [
        { id: "viloyatlar", label: "Viloyatlar", cols: [{ key: "name", label: "Viloyat" }, { key: "soato", label: "SOATO" }],
          rows: VILOYAT_SOATO.map(function (v) { return { name: v[0], soato: v[1] }; }) },
        { id: "tumanlar", label: "Tumanlar", cols: [{ key: "name", label: "Tuman" }, { key: "soato", label: "SOATO" }], regionFilter: true,
          rows: [
            { name: "Mirobod tumani", soato: "1726273", region: "Toshkent shahri" },
            { name: "Sirg‘ali tumani", soato: "1726283", region: "Toshkent shahri" },
            { name: "Shayxontoxur tumani", soato: "1726277", region: "Toshkent shahri" },
            { name: "Chilonzor tumani", soato: "1726294", region: "Toshkent shahri" },
            { name: "Yakkasaroy tumani", soato: "1726287", region: "Toshkent shahri" },
            { name: "Mirzo Ulug‘bek tumani", soato: "1726269", region: "Toshkent shahri" },
            { name: "Uchtepa tumani", soato: "1726262", region: "Toshkent shahri" },
            { name: "Yunusobod tumani", soato: "1726266", region: "Toshkent shahri" },
            { name: "Chinoz tumani", soato: "1727256", region: "Toshkent viloyati" },
            { name: "Bekobod shahri", soato: "1727413", region: "Toshkent viloyati" },
            { name: "Bo‘ka tumani", soato: "1727228", region: "Toshkent viloyati" },
            { name: "Ohangaron tumani", soato: "1727212", region: "Toshkent viloyati" },
            { name: "Asaka tumani", soato: "1703202", region: "Andijon viloyati" },
            { name: "Andijon shahri", soato: "1703401", region: "Andijon viloyati" }
          ] }
      ]
    },
    {
      id: "umumiy", label: "Umumiy", items: [
        { id: "tillar", label: "Tillar", rows: rows1(["O‘zbek", "Rus", "Ingliz", "Qoraqalpoq"]) },
        { id: "ish_kunlari", label: "Ish kunlari", rows: rows1(["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"]) },
        { id: "ish_soatlari", label: "Ish soatlari", rows: rows1(["08:00 – 17:00", "09:00 – 18:00", "24/7", "Smenali"]) },
        { id: "turlar", label: "Turlar", rows: rows1(["Davlat muassasasi", "Davlat unitar korxonasi", "Xususiy", "Qo‘shma"]) },
        { id: "mutaxassislik", label: "Mutaxassislik", rows: rows1(["Gematolog", "Terapevt", "Pediatr", "Jarroh", "Laborant", "Hamshira"]) },
        { id: "yonalish_kodlari", label: "Yo‘nalish kodlari", rows: rows1(["G34", "G36", "G37", "G38", "G39", "G43", "G44", "G45", "G46", "G47"]) },
        { id: "budjet_darajalari", label: "Budjet darajalari", rows: rows1(["Respublika budjeti", "Viloyat budjeti", "Tuman (shahar) budjeti"]) },
        { id: "huquqiy_shakl", label: "Tashkilot huquqiy shakli", rows: rows1(["Davlat muassasasi", "DUK", "MChJ", "AJ"]) },
        { id: "uzilishlar", label: "Kunlik uzilishlar vaqti", rows: rows1(["12:00 – 13:00", "13:00 – 14:00", "Uzilishsiz"]) }
      ]
    },
    {
      id: "bino", label: "Bino va infratuzilma", items: [
        { id: "bino_turlari", label: "Bino turlari", rows: rows1(["Ma’muriy bino", "Davolash korpusi", "Ombor", "Garaj", "Qozonxona"]) },
        { id: "bino_qavat", label: "Bino qavatining turlari", rows: rows1(["1 qavatli", "2 qavatli", "3–5 qavatli", "Ko‘p qavatli"]) },
        { id: "bino_poydevor", label: "Bino poydevori turi", rows: rows1(["Beton", "Temir-beton", "Tosh", "G‘isht"]) },
        { id: "bino_loyiha", label: "Bino loyiha turi", rows: rows1(["Namunaviy loyiha", "Individual loyiha", "Moslashtirilgan"]) },
        { id: "xona_turi", label: "Xona turi", rows: rows1(["Palata", "Operatsiya xonasi", "Laboratoriya", "Kabinet", "Yordamchi xona"]) },
        { id: "asosiy_vosita", label: "Asosiy vosita turlari", rows: rows1(["Binolar", "Inshootlar", "Mashina va uskunalar", "Transport", "Inventar"]) },
        { id: "asosiy_aktivlar", label: "Asosiy aktivlar", rows: rows1(["Moddiy aktivlar", "Nomoddiy aktivlar", "Biologik aktivlar"]) },
        { id: "geo_joylashuv", label: "Geografik joylashuv", rows: rows1(["Markaz", "Shimol", "Janub", "Sharq", "G‘arb"]) }
      ]
    },
    {
      id: "kommunal", label: "Kommunal ta’minot", items: [
        { id: "ichimlik_suvi", label: "Ichimlik suvi ta’minoti turlari", rows: rows1(["Markazlashgan", "Quduq", "Tashib keltiriladi"]) },
        { id: "issiq_suv", label: "Issiq suv ta’minoti turlari", rows: rows1(["Markazlashgan", "Lokal qozonxona", "Elektr suv isitgich", "Yo‘q"]) },
        { id: "issiqlik", label: "Issiqlik ta’minoti turlari", rows: rows1(["Markazlashgan", "Lokal qozonxona", "Elektr", "Gaz pech"]) },
        { id: "quvvat", label: "Quvvat ta’minoti turlari", rows: rows1(["Markazlashgan tarmoq", "Generator", "Quyosh panellari"]) },
        { id: "telefon", label: "Telefon tarmoq turlari", rows: rows1(["Shahar ATS", "IP-telefoniya", "Mobil"]) },
        { id: "kanalizatsiya", label: "Kanalizatsiya turlari", rows: rows1(["Markazlashgan", "Lokal (septik)", "Yo‘q"]) },
        { id: "isitish", label: "Isitish turlari", rows: rows1(["Markaziy isitish", "Avtonom qozonxona", "Elektr isitish"]) },
        { id: "internet", label: "Internet ulanish turi", rows: rows1(["Optik tola", "ADSL", "4G/5G", "Sun’iy yo‘ldosh"]) },
        { id: "qoriqlash_post", label: "Qo‘riqlash post turi", rows: rows1(["Doimiy post", "Kunduzgi post", "Video kuzatuv", "Signalizatsiya"]) }
      ]
    },
    {
      id: "transport", label: "Transport", items: [
        { id: "transport_turlari", label: "Transport turlari", rows: rows1(["Yengil avtomobil", "Tez yordam", "Yuk avtomobili", "Avtobus", "Maxsus texnika"]) },
        { id: "transport_guruhlari", label: "Transport guruhlari", rows: rows1(["Xizmat transporti", "Tibbiy transport", "Xo‘jalik transporti"]) },
        { id: "transport_brendi", label: "Transport brendi", rows: rows1(["Chevrolet", "Damas", "Volkswagen", "ISUZU", "GAZ"]) },
        { id: "transport_yoqilgi", label: "Transport yoqilg‘isi turi", rows: rows1(["Benzin", "Propan", "Metan", "Dizel", "Elektr"]) }
      ]
    },
    {
      id: "boshqa", label: "Madaniyat va boshqalar", items: [
        { id: "teatr_toifa", label: "Davlat teatrlar toifasi", rows: rows1(["Milliy teatr", "Akademik teatr", "Viloyat teatri"]) },
        { id: "muzey_toifa", label: "Davlat muzeylari toifasi", rows: rows1(["Milliy muzey", "Viloyat muzeyi", "Uy-muzey"]) },
        { id: "muzey_guruh", label: "Davlat muzeylari guruhlari", rows: rows1(["Tarixiy", "San’at", "Memorial", "O‘lkashunoslik"]) },
        { id: "madaniy_markaz", label: "Madaniy markazlar", rows: rows1(["Madaniyat saroyi", "Madaniyat uyi", "Klub"]) },
        { id: "konsert", label: "Konsert-tomosha muassasalari", rows: rows1(["Filarmoniya", "Konsert zali", "Sirk"]) },
        { id: "ovqatlantirish", label: "Ovqatlantirish usuli", rows: rows1(["O‘z oshxonasi", "Autsorsing", "Yo‘q"]) },
        { id: "oziq_yoqilgi", label: "Oziq-ovqat uchun yoqilg‘i", rows: rows1(["Gaz", "Elektr", "Ko‘mir", "O‘tin"]) },
        { id: "qadoqlash", label: "Qadoqlash turi", rows: rows1(["Standart", "Vakuum", "Sovuq zanjir"]) },
        { id: "issiqxona", label: "Issiqxona issiqlik ta’minoti", rows: rows1(["Gaz qozon", "Ko‘mir qozon", "Geotermal"]) }
      ]
    }
  ];

  /* ---- Foydalanuvchilar (rollar: admin / manager / user) ---- */
  var USERS = [
    { fio: "ASADOV SAIDAMIRXON MAXMUDXONOVICH", pinfl: "30410900190042", org: "RIGIATM", stir: "201190732", role: "admin" },
    { fio: "PRIMBETOV QURALBAY KENESBAYEVICH", pinfl: "32612773370058", org: "“QUWANISHJARMA IRRIGATSIYA TARMAG‘I BASQARMASI” DM", stir: "204089743", role: "user" },
    { fio: "RAYIMKULOV FIRDAVS ABDISOBIROVICH", pinfl: "31404843850015", org: "“IQTISODIYOT VA MOLIYA VAZIRLIGI” DM", stir: "306759560", role: "user" },
    { fio: "SHAKIROV SHUXRAT BATIRBAYEVICH", pinfl: "30510910660014", org: "“IQTISODIYOT VA MOLIYA VAZIRLIGI” DM", stir: "306676483", role: "manager" },
    { fio: "ALIMOV ERMUXAMMAD BERDAXOVICH", pinfl: "33001863460022", org: "“QIRG‘OQLARNI HIMOYALASH INSHOOTLAR BOSHQARMASI” DM", stir: "207185194", role: "user" },
    { fio: "AHMADJONOV ALIAKBAR AKMAL O‘G‘LI", pinfl: "32003975960062", org: "“BUDJETDAN TASHQARI PENSIYA JAMG‘ARMASI ANDIJON BOSHQARMASI” DM", stir: "312144827", role: "user" },
    { fio: "ORAZBAYEV IZZAT NARBAYEVICH", pinfl: "30707853490015", org: "“HAYVONLAR KASALLIKLARI TASHXISI DAVLAT MARKAZI” DM", stir: "203250892", role: "manager" },
    { fio: "MAMADIYAROVA MUKADDAS ZIYADULLAYEVNA", pinfl: "42909860190042", org: "", stir: "", role: "user" },
    { fio: "ARZIMBETOV ALISHER JOLIMBETOVICH", pinfl: "31104853410024", org: "“O‘RMON XO‘JALIGI ILMIY-TADQIQOT INSTITUTI” DM", stir: "306697838", role: "user" },
    { fio: "XUDAYBERGENOV BAXTIYAR KADIRBAYEVICH", pinfl: "31907643400018", org: "“ARAL BO‘YI DELTA BASQARMASI” DM", stir: "306758887", role: "user" },
    { fio: "SAIDOV AKMAL XOLMATOVICH", pinfl: "31110580240034", org: "“INSON HUQUQLARI MILLIY MARKAZI” DM", stir: "203559110", role: "manager" },
    { fio: "TESHABAYEVA UMIDA ALIMDJANOVNA", pinfl: "42203750260032", org: "“ALISHER NAVOIY MILLIY KUTUBXONASI” DM", stir: "301247933", role: "user" }
  ];

  /* ---- Sohalar va yo'nalishlar (Konstruktor) ---- */
  var MENUS = [
    { id: "umumiy", label: "Umumiy ma’lumot", submenus: [
      { id: "aloqa", label: "Aloqa o‘rnatish bo‘yicha ma’lumot", fields: [
        { label: "Hisobchi familiyasi, ismi va sharifi", on: true },
        { label: "Rahbar familiyasi, ismi va sharifi", on: true },
        { label: "Elektron pochta nomi", on: true },
        { label: "Pochta index raqami", on: true },
        { label: "Veb-sahifa nomi", on: false },
        { label: "Tashkilot raxbar o‘rinbosarlarining F.I.Sh", on: false },
        { label: "Xodim kontakti", on: false }
      ] },
      { id: "faoliyat", label: "Faoliyati va rejimi to‘g‘risida ma’lumot", fields: [
        { label: "Faoliyat turi", on: true }, { label: "Ish rejimi", on: true }, { label: "Ish kunlari", on: true }, { label: "Smenalar soni", on: false }
      ] },
      { id: "asosiy", label: "Asosiy ma’lumot", fields: [
        { label: "Tashkilot nomi", on: true }, { label: "STIR", on: true }, { label: "Huquqiy shakli", on: true }, { label: "Budjet darajasi", on: true }
      ] },
      { id: "sugurta", label: "Davlat tibbiy sug‘urtasi ko‘rsatkichlari", fields: [
        { label: "Sug‘urta shartnomalari", on: false }, { label: "Pullik xizmat tushumi", on: true }
      ] },
      { id: "filial", label: "Filial va binolar", fields: [
        { label: "Filiallar soni", on: true }, { label: "Binolar soni", on: true }
      ] },
      { id: "mablag", label: "Mablag‘ ajratilishi bo‘yicha ma’lumot", fields: [
        { label: "Yillik smeta", on: true }, { label: "Moliyalashtirish manbasi", on: true }
      ] }
    ] },
    { id: "joylashuv", label: "Joylashuv va ko‘rsatkichlar", submenus: [
      { id: "manzil", label: "Manzil ma’lumotlari", fields: [
        { label: "Viloyat / tuman", on: true }, { label: "Manzil", on: true }, { label: "Geolokatsiya", on: true }
      ] },
      { id: "korsatkich", label: "Asosiy ko‘rsatkichlar", fields: [
        { label: "Umumiy maydon", on: true }, { label: "Bino maydoni", on: true }
      ] }
    ] },
    { id: "mtb", label: "Moddiy texnik baza", submenus: [
      { id: "transport", label: "Transport vositalari", fields: [
        { label: "YHXBB reestri", on: true }, { label: "Avtomobil limitlari", on: true }
      ] },
      { id: "jihoz", label: "Jihozlar", fields: [
        { label: "UZASBO jihozlar", on: true }, { label: "Inventarizatsiya", on: false }
      ] }
    ] }
  ];

  var SOHALAR = [
    "Ijtimoiy himoya tashkilotlari", "Boshqalar", "Nodavlat notijorat tashkilotlari va fuqarolik jamiyati institutlari",
    "Sud, prokuratura va adliya organlari", "Davlat markaziy hokimiyati va davlat boshqaruvi organlari",
    "Gidrometeorologiya xizmati markazi", "Qishloq xo‘jaligi", "Atrof-muhitni muhofaza qilish", "Obodonlashtirish",
    "Suv xo‘jaligi", "Fan (oliy ta’lim va ilmiy tadqiqiot muassasalari)", "Sport", "Madaniyat", "Sog‘liqni saqlash",
    "Kadrlar tayyorlash (akademik litsey, texnikum va kasb hunar maktablari)", "Maktabgacha ta’lim", "Umumiy ta’lim",
    "Budjetdan tashqari tashkilotlar"
  ].map(function (name, i) {
    var dirs;
    if (i === 0) dirs = [
      ["G34", "Keksalar, nogironligi bo‘lgan shaxslar, urush va mehnat faxriylari uchun sanatoriyalar"],
      ["G36", "Muruvvat ayollar va erkaklar internat uyi"],
      ["G37", "Sahovat internat uylari"],
      ["G38", "Urush va mehnat faxriylari uchun respublika pansionati"],
      ["G39", "“Muruvvat” nogironligi bo‘lgan bolalar uchun internat uyi"],
      ["G43", "Odam savdosi jabrdiydalariga yordam berish respublika reabilitatsiya markazi"],
      ["G44", "Nogironligi bo‘lgan shaxslarni reabilitatsiya qilish va protezlash milliy markazi"],
      ["G45", "Nogironligi bo‘lgan shaxslar uchun hududiy reabilitatsiya markazlari"],
      ["G46", "Ayollarni reabilitatsiya qilish va moslashtirish hududiy boshqarmasi"],
      ["G47", "Ijtimoiy himoya inspeksiyasi"]
    ];
    else if (i === 13) dirs = [
      ["S01", "Ixtisoslashtirilgan markazlar va shifoxonalar"],
      ["S02", "Tuman markaziy shifoxonalari"],
      ["S03", "Oilaviy poliklinikalar"]
    ];
    else if (i === 16) dirs = [
      ["M01", "Umumta’lim maktablari (I–IV guruh)"],
      ["M02", "Ixtisoslashtirilgan maktablar"]
    ];
    else dirs = [["K" + (10 + i), name + " yo‘nalishi"]];
    return {
      name: name,
      directions: dirs.map(function (d) {
        return { code: d[0], name: d[1], menus: JSON.parse(JSON.stringify(MENUS)) };
      })
    };
  });

  /* ---- Shtat shablonlari (7 ta forma) ---- */
  var SHTAT_TEMPLATES = [
    "Umumiy kadrlar", "Band bo‘lgan shtat lavozimlar", "Shtat lavozimlarida band bo‘lgan jismoniy shaxslar",
    "Shtat lavozimlarida va pedagogik hamda tibbiyot stavkalarda band bo‘lgan jismoniy shaxslarning malaka toifalari",
    "Vakant shtat lavozimlar", "Pedagogik va tibbiyot xodimlar stavkasi", "Qolgan shtat lavozimlari"
  ].map(function (name, i) { return { name: name, created: "2026-02-27", updated: "2026-02-27", sohalar: i === 3 ? ["Sog‘liqni saqlash", "Umumiy ta’lim"] : ["Sog‘liqni saqlash"] }; });

  /* ---- Builder: menyular va maydon ta'riflari ---- */
  var BUILDER_MENUS = [
    { name: "Davlat boshqaruv organlari", types: 112, code: "davlatBoshqaruvOrganlariTashkilotlari", order: 1, tabs: 2, active: true },
    { name: "Madaniyat", types: 104, code: "madaniyat", order: 1, tabs: 1, active: true },
    { name: "Oliy Ta’lim", types: 99, code: "OLIY_TALIM", order: 1, tabs: 3, active: true },
    { name: "Sport", types: 42, code: "SPORT", order: 10, tabs: 4, active: true },
    { name: "Suv xo‘jaligi — nasos stansiyalar", types: 1, code: "SUV_XOJALIGI_NASOS_STANSIYALAR", order: 10, tabs: 6, active: true },
    { name: "Ijtimoiy himoya", types: 16, code: "IH", order: 20, tabs: 5, active: true },
    { name: "Obodonlashtirish", types: 71, code: "OBODON", order: 30, tabs: 10, active: true },
    { name: "Sog‘liqni saqlash", types: 96, code: "HEALTH_SN", order: 40, tabs: 10, active: true },
    { name: "Prof ta’lim", types: 91, code: "PROF_TALIM", order: 50, tabs: 7, active: true },
    { name: "Test SSV Shtat", types: 1, code: "HEALTH_SN_COPY1", order: 51, tabs: 10, active: false }
  ];

  var FIELD_DEFS = [
    { key: "sy_bud_urin_kun_ijrosi_foizi", name: "—", type: "NUMBER", required: false, child: 0, place: 0, active: true },
    { key: "noldan18GachaYosh", name: "0 yoshdan 18 yoshgacha", type: "NUMBER", required: false, child: 0, place: 1, active: true },
    { key: "noldan18GachaYosh1", name: "0 yoshdan 18 yoshgacha", type: "SELECTION", required: false, child: 0, place: 0, active: true },
    { key: "amb_yosh_0_dan_18_gacha", name: "0 yoshdan 18 yoshgacha aholi", type: "NUMBER", required: false, child: 0, place: 8, active: true },
    { key: "mak_on_on_bir_sinflar_jami", name: "10–11-sinflar jami", type: "NUMBER", required: false, child: 0, place: 2, active: true },
    { key: "mak_on_on_bir_oquvchilar_jami", name: "10–11-sinf o‘quvchilar jami", type: "NUMBER", required: false, child: 0, place: 2, active: true },
    { key: "on_sinf_oquvchilari_soni", name: "10-sinf o‘quvchilari soni", type: "NUMBER", required: false, child: 0, place: 1, active: true },
    { key: "amb_yosh_18_katta_aholi", name: "18 yoshdan katta aholi", type: "NUMBER", required: false, child: 0, place: 4, active: true },
    { key: "kurs1", name: "1-Kurs", type: "NUMBER", required: false, child: 0, place: 8, active: true },
    { key: "talim_1_kurs_grant_guruh_sinf11", name: "1-kurs grant guruh (11-sinf)", type: "NUMBER", required: false, child: 0, place: 10, active: true },
    { key: "talim_1_kurs_grant_uquvchi_son", name: "1-kurs grant o‘quvchilar soni", type: "NUMBER", required: false, child: 0, place: 10, active: true },
    { key: "talim_1_kurs_guruhlar_son", name: "1-kurs guruhlar soni", type: "NUMBER", required: false, child: 0, place: 10, active: true }
  ];

  /* ---- So'rovlar jurnali ---- */
  var LOG_USERS = [
    { name: "SHERZOD NEMATOV", role: "USER · ORG_DIRECTOR", stir: "311858341" },
    { name: "SAIDAMIRXON ASADOV", role: "ADMIN · ADMIN", stir: "204089743" },
    { name: "NARGIZA PRIMBETOVA", role: "USER · ORG_DIRECTOR", stir: "203464894" }
  ];
  var LOG_PATHS = [
    ["GET", "/room-type", 2], ["GET", "/v2/organization/building/6862/details", 38],
    ["GET", "/v2/organization/building/6862/steps", 137], ["GET", "/v2/organization/building/floors/15375/rooms", 33],
    ["GET", "/organization/building/6862", 4], ["POST", "/v2/organization/building/floors/15375/rooms", 18],
    ["GET", "/region", 4], ["GET", "/organization-type", 18], ["GET", "/direction", 4],
    ["GET", "/organization/admin", 215], ["GET", "/request-logs", 764], ["GET", "/organization/building", 18],
    ["GET", "/file", 19], ["GET", "/organizations/15192/menus", 6], ["GET", "/organization-info/basic", 32],
    ["GET", "/user/me", 9]
  ];
  var LOGS = [];
  for (var li = 0; li < 48; li++) {
    var p = LOG_PATHS[li % LOG_PATHS.length], u = LOG_USERS[li % 3];
    var mm = 11 - Math.floor(li / 10), ss = 59 - (li * 7) % 60;
    LOGS.push({
      time: "22.07.2026 10:" + String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0"),
      scope: p[1] === "/file" ? "Fayl" : "Tashkilot",
      method: p[0], path: p[1], status: 200, ms: p[2],
      user: u.name, role: u.role, stir: u.stir,
      reqId: (li * 2654435761 % 4294967296).toString(16).slice(0, 8) + "…"
    });
  }

  /* ---- Tashkilot ma'lumoti sahifasi (admin drill-in) ---- */
  var STAFF_INT_CATS = [
    { cat: "Umumiy kadrlar", vals: ["24.0", "7.0", "1.0", "16.0", null] },
    { cat: "Band bo‘lgan shtat lavozimlar", vals: ["23.5", "7.0", "1.0", "15.5", null] },
    { cat: "Shtat lavozimlarida band bo‘lgan jismoniy shaxslar", vals: ["27.0", "7.0", "2.0", "18.0", null] },
    { cat: "Vakant shtat lavozimlar", vals: ["0.5", "0.0", "0.0", "0.5", null] }
  ];
  var STAFF_INT_ROWS = [];
  STAFF_INT_CATS.forEach(function (c) {
    [
      ["Shtat lavozimlar", "Shtat lavozimlar soni", 0],
      ["Shtat lavozimlar", "Boshqaruv xodimlar soni", 1],
      ["Shtat lavozimlar", "Ishlab chiqarish xodimlar soni", 3],
      ["Shtat lavozimlar", "Texnik xodimlar va xizmat ko‘rsatish xodimlar soni", 4],
      ["Ta’rif ro‘yxati bo‘yicha lavozimlar", "Pedagogik stavkalar soni", 4]
    ].forEach(function (r, i) {
      STAFF_INT_ROWS.push({ cat: c.cat, type: r[0], pos: r[1], intId: r[2], qty: c.vals[i] == null ? "{}" : '{"1":' + c.vals[i] + "}" });
    });
  });

  var ASSET_NAMES = [
    "Matematika (1-qism) darslik 6-sinf (rus)-2024", "Tabiiy fanlar darslik 6-sinf (o‘zbek)-2024",
    "Matematika darslik (1-qism) 6-sinf (o‘zbek)-2024", "Matematika darslik (1-qism) 5-sinf (rus)-2024",
    "Ona tili (1-qism) darslik 5-sinf (rus)-2024", "O‘zbek tili 1-qism darslik 5-sinf (rus va qardosh)-2024",
    "Matematika darslik (1-qism) 5-sinf (o‘zbek)-2024", "Adabiyot (1-qism) darslik 5-sinf (o‘zbek)-2024",
    "Ona tili (1-qism) darslik 5-sinf (o‘zbek)-2024", "Tabiiy fanlar darslik 5-sinf (o‘zbek)-2024",
    "Tasviriy san’at darslik 5-sinf (o‘zbek)-2024", "Musiqa darslik 5-sinf (o‘zbek)-2024",
    "Adabiyot (2-qism) darslik 10-sinf (rus)-2024", "Adabiyot (1-qism) darslik 10-sinf (rus)-2024",
    "Chaqiruvga qadar boshlang‘ich tayyorgarlik (darslik) 10-sinf (o‘zbek)-2024", "Jahon tarixi darslik 8-sinf (o‘zbek)-2024",
    "Matematika darslik (2-qism) 1-sinf (rus)-2024", "Informatika va axborot texnologiyalari 5-sinf darslik rus-2024",
    "Tabiiy fanlar 2-bo‘lim darslik 4-sinf (rus)-2024", "Fotoapparat #44354990#"
  ];
  var ASSETS = [];
  for (var ai = 0; ai < 60; ai++) {
    var qty = [90, 50, 105, 70, 40, 105, 50, 50][ai % 8];
    ASSETS.push({
      account: ai === 0 ? "401722860262877019909072002" : "100022860262877092100072006",
      fio: "MAMADALIYEV BAXROMJON IKROMJON O‘G‘LI",
      dept: "школа 100", budget: "0 - Бюджетный",
      hisob: ai === 0 ? "221222" : "221331",
      inv: ai === 0 ? "22122230000399" : String(22133100000877 - ai),
      article: ai === 0 ? "4354990" : "4355300",
      name: ASSET_NAMES[ai % ASSET_NAMES.length],
      unit: ai === 0 ? "Комплект" : "Штука",
      qty: ai === 0 ? 1 : qty,
      sum: (ai === 0 ? 5100000 : qty * 31500) + (ai * 137) % 900
    });
  }

  var ORG_DETAIL = {
    userFields: { done: 23, total: 23 },
    lastSync: "2026-06-19",
    tabs: [
      { id: "umumiy", label: "Umumiy ma’lumotlari", pct: 100, sections: [
        { title: "Asosiy ma’lumotlari", done: 7, total: 7 },
        { title: "Faoliyati va rejimi to‘g‘risida ma’lumot", done: 5, total: 5 },
        { title: "Filiallar", done: 0, total: 0 },
        { title: "Aloqa o‘rnatish bo‘yicha ma’lumotlar", done: 6, total: 6 }
      ] },
      { id: "joylashuv", label: "Joylashuv va ko‘rsatkichlar", pct: 0, sections: [
        { title: "Manzil ma’lumotlari", done: 0, total: 4 },
        { title: "Asosiy ko‘rsatkichlar", done: 0, total: 3 }
      ] },
      { id: "kadrlar", label: "Kadrlar bilan ishlash", pill: "1/1", integrations: [
        { id: "staffint", title: "Xodimlar integratsiyasi", loaded: true, updated: "2026-06-19T04:29:17.915334Z" }
      ] },
      { id: "infra", label: "Infrostruktura", integrations: [
        { id: "infra", title: "Infratuzilma ma’lumotlari", loaded: false }
      ] },
      { id: "mtb", label: "Moddiy texnik baza", pct: 100, pill: "2/2", integrations: [
        { id: "assets", title: "Asosiy vositalar", loaded: true, updated: "2026-06-19T04:31:02.104211Z", rows: 60 },
        { id: "transport", title: "Transport vositalari (YHXBB)", loaded: true, updated: "2026-06-19T04:32:44.551903Z", rows: 5 }
      ] },
      { id: "kommunal", label: "Kommunal xarajatlar", pill: "0/2", integrations: [
        { id: "gaz", title: "Gaz ta’minoti", loaded: false },
        { id: "elektr", title: "Elektr ta’minoti", loaded: false }
      ] },
      { id: "qarzlar", label: "Mavjud qarzlar", pill: "0/2", integrations: [
        { id: "soliq_tolov", title: "Soliq to‘lovlari", loaded: false },
        { id: "soliq_qarz", title: "Soliq qarzlari", loaded: false }
      ] },
      { id: "mib", label: "MIB ma’lumotlari", pill: "0/1", integrations: [
        { id: "majburiy_ijro", title: "Majburiy ijro", loaded: false }
      ] }
    ],
    staffIntegration: STAFF_INT_ROWS,
    assets: ASSETS
  };

  /* ---- Xarita: map type -> viloyat nomi ---- */
  var MAP_REGION_NAMES = {
    karakalpak: "Qoraqalpog‘iston Respublikasi",
    khwarezm: "Xorazm viloyati",
    navoi: "Navoiy viloyati",
    bukhara: "Buxoro viloyati",
    samarqand: "Samarqand viloyati",
    qarshi: "Qashqadaryo viloyati",
    surxon: "Surxondaryo viloyati",
    jizzakh: "Jizzax viloyati",
    sirdaryo: "Sirdaryo viloyati",
    toshkent: "Toshkent viloyati",
    toshkent_sh: "Toshkent shahri",
    namangan: "Namangan viloyati",
    fergana: "Farg‘ona viloyati",
    andijan: "Andijon viloyati"
  };

  /* ---- Binolar reestri (hudud/soha/tur kesimida, deterministik mock) ---- */
  var B_TYPES = ["Poliklinika", "Davolash korpusi", "Ma’muriy bino", "Omborxona", "Garaj", "Qozonxona", "O‘likxona (patologiya)", "Suzish havzasi (basseyn)", "Oshxona bloki", "Laboratoriya"];
  var B_SOHA = ["Sog‘liqni saqlash", "Umumiy ta’lim", "Maktabgacha ta’lim", "Madaniyat", "Sport"];
  var BUILDINGS = [];
  Object.keys(MAP_REGION_NAMES).forEach(function (key, ri) {
    var region = MAP_REGION_NAMES[key];
    var districts = (global.UZB_REGIONS && global.UZB_REGIONS[region]) || ["Markaziy tuman"];
    var count = 14 + ((ri * 7) % 12); // 14..25 ta bino
    for (var i = 0; i < count; i++) {
      var soha = B_SOHA[(ri + i) % B_SOHA.length];
      var type = B_TYPES[(ri * 3 + i) % B_TYPES.length];
      var built = 1965 + ((i * 13 + ri * 7) % 58);            // 1965..2022
      var ren = built + 8 + ((i * 5 + ri) % 28);
      if (ren > 2025) ren = null;                              // hali ta'mirlanmagan
      BUILDINGS.push({
        region: region, regionKey: key,
        district: districts[(i * 3 + ri) % districts.length],
        org: (function (short) {
          if (soha === "Sog‘liqni saqlash") return i % 3 === 0 ? short + " ko‘p tarmoqli tibbiyot markazi" : short + " " + (100 + i) + "-oilaviy poliklinika";
          if (soha === "Umumiy ta’lim") return "“" + (100 + i * 2 + ri) + "-sonli maktab” DM (" + short + ")";
          if (soha === "Maktabgacha ta’lim") return short + " " + (50 + i) + "-sonli MTT";
          if (soha === "Madaniyat") return short + " " + (120 + i) + "-madaniyat uyi";
          return short + " bolalar-o‘smirlar sport maktabi";
        })(region.replace(" viloyati", "").replace(" Respublikasi", "")),
        soha: soha, type: type,
        area: 250 + ((i * 173 + ri * 97) % 4800),              // m²
        built: built, renovated: ren,
        status: !ren || ren < 2008 ? "repair" : "good"
      });
    }
  });

  global.ADMIN_DATA = {
    mapRegionNames: MAP_REGION_NAMES,
    buildings: BUILDINGS,
    buildingTypes: B_TYPES,
    buildingSoha: B_SOHA,
    orgDetail: ORG_DETAIL,
    classifiers: CLASSIFIERS,
    users: USERS,
    sohalar: SOHALAR,
    shtatTemplates: SHTAT_TEMPLATES,
    builderMenus: BUILDER_MENUS,
    fieldDefs: FIELD_DEFS,
    logs: LOGS
  };
})(window);
