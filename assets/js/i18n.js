/* ==========================================================================
   i18n — single localization mechanism.
   Languages: uz-latn (default), uz-cyrl, ru.
   Usage:
     I18N.t('key')                 -> string
     I18N.setLang('ru')            -> re-render all [data-i18n]
     data-i18n="key"               -> textContent
     data-i18n-attr="placeholder:key;title:key2"
   ========================================================================== */
(function (global) {
  "use strict";

  var DICT = {
    "uz-latn": {
      /* App / brand */
      "app.name": "Budjet Passport",
      "app.subtitle": "Tashkilot kabineti",
      "app.org": "Toshkent tibbiyot muassasasi",
      "app.org_short": "TTM #7",

      /* Language names */
      "lang.uz-latn": "O‘zbekcha (lotin)",
      "lang.uz-cyrl": "Ўзбекча (кирилл)",
      "lang.ru": "Русский",
      "lang.label": "Til",
      "theme.label": "Mavzu",
      "theme.light": "Yorug‘",
      "theme.dark": "Tungi",
      "theme.toggle": "Mavzuni almashtirish",

      /* Nav / sections */
      "nav.menu": "Menyu",
      "nav.general": "Umumiy ma’lumot",
      "nav.location": "Joylashuv",
      "nav.staff": "Kadrlar bilan ishlash",
      "nav.material": "Moddiy texnik baza",
      "nav.utilities": "Kommunal xarajatlar",
      "nav.debts": "Mavjud qarzlar",
      "nav.mib": "Tibbiy sug‘urta (MIB)",
      "nav.health": "Sog‘liqni saqlash",

      /* Common */
      "common.actions": "Amallar",
      "common.edit": "Tahrirlash",
      "common.save": "Saqlash",
      "common.cancel": "Bekor qilish",
      "common.close": "Yopish",
      "common.add": "Qo‘shish",
      "common.total": "Jami",
      "common.category": "Toifa",
      "common.name": "Nomi",
      "common.count": "Soni",
      "common.amount": "Summa",
      "common.date": "Sana",
      "common.status": "Holati",
      "common.percent": "Foiz",
      "common.chart_view": "Chart ko‘rinishi",
      "common.table_view": "Jadval ko‘rinishi",
      "common.currency": "so‘m",
      "common.people": "kishi",
      "common.units": "dona",
      "common.export": "Eksport",
      "common.print": "Chop etish",
      "common.updated": "Yangilangan",
      "common.of_plan": "rejadan",

      /* Empty state */
      "empty.title": "Ma’lumot mavjud emas",
      "empty.desc": "Bu bo‘lim uchun hozircha yozuvlar kiritilmagan.",
      "empty.cta": "Ma’lumot qo‘shish",

      /* Status values */
      "status.new": "Yangi",
      "status.active": "Faol",
      "status.pending": "Kutilmoqda",
      "status.closed": "Yopilgan",
      "status.overdue": "Muddati o‘tgan",

      /* Page titles / descriptions */
      "page.general.title": "Umumiy ma’lumot",
      "page.general.desc": "Tashkilotning asosiy, aloqa va moliyaviy ko‘rsatkichlari.",
      "page.location.title": "Joylashuv",
      "page.location.desc": "Tashkilot manzili va hududiy bo‘linmalari.",
      "page.staff.title": "Kadrlar bilan ishlash",
      "page.staff.desc": "Shtat birliklari, band va vakant lavozimlar taqsimoti.",
      "page.material.title": "Moddiy texnik baza",
      "page.material.desc": "Bino, jihoz va transport vositalari.",
      "page.utilities.title": "Kommunal xarajatlar",
      "page.utilities.desc": "Kommunal va aloqa xizmatlari sarfi.",
      "page.debts.title": "Mavjud qarzlar",
      "page.debts.desc": "Qarzdorlik, qo‘shimcha va oshiqcha to‘lovlar dinamikasi.",
      "page.mib.title": "Tibbiy sug‘urta / Mablag‘",
      "page.mib.desc": "Byudjet va pullik mablag‘lar harakati.",
      "page.health.title": "Sog‘liqni saqlash",
      "page.health.desc": "Statsionar va ambulator ko‘rsatkichlar.",

      /* General section */
      "general.kpi.staff_total": "Jami shtat",
      "general.kpi.occupied": "Band lavozim",
      "general.kpi.vacant": "Vakant",
      "general.kpi.debt": "Umumiy qarzdorlik",
      "general.basic": "Asosiy ma’lumotlar",
      "general.contact": "Aloqa ma’lumotlari",
      "general.insurance": "Tibbiy sug‘urta / Mablag‘",
      "general.f.name": "Tashkilot nomi",
      "general.f.inn": "STIR (INN)",
      "general.f.type": "Tashkilot turi",
      "general.f.region": "Hudud",
      "general.f.head": "Rahbar",
      "general.f.founded": "Tashkil etilgan yil",
      "general.f.phone": "Telefon",
      "general.f.email": "Elektron pochta",
      "general.f.address": "Manzil",
      "general.f.website": "Veb-sayt",
      "general.type.medical": "Tibbiyot muassasasi",

      /* Money movement */
      "mib.start_balance": "Yil boshi qoldiq",
      "mib.income": "Jami tushum",
      "mib.expense": "Kassa xarajati",
      "mib.end_balance": "Hisobot oxiri qoldiq",
      "mib.budget": "Byudjet",
      "mib.paid": "Pullik",
      "mib.source": "Tushum manbai",
      "mib.by_source": "Tushum manbalari bo‘yicha",
      "mib.movement": "Mablag‘ harakati",
      "src.state": "Davlat byudjeti",
      "src.paid_services": "Pullik xizmatlar",
      "src.insurance": "Sug‘urta to‘lovlari",
      "src.grants": "Grant va yordam",

      /* Staff */
      "staff.by_position": "Shtat lavozimlar taqsimoti",
      "staff.compare": "Shtat / Band / Vakant solishtiruvi",
      "staff.by_tarif": "Ta’rif ro‘yxati bo‘yicha lavozimlar",
      "staff.cat.management": "Boshqaruv",
      "staff.cat.production": "Ishlab chiqarish",
      "staff.cat.technical": "Texnik xodimlar",
      "staff.col.staff": "Shtat bo‘yicha",
      "staff.col.occupied": "Band bo‘lgan",
      "staff.col.vacant": "Vakant",
      "staff.tarif.others": "Boshqalar",
      "staff.tarif.junior_med": "Kichik tibbiy",
      "staff.tarif.mid_med": "O‘rta tibbiy",
      "staff.tarif.pedagog": "Pedagogik",
      "staff.tarif.doctors": "Vrachlar",

      /* Debts */
      "debts.kpi.debt": "Qarzdorlik",
      "debts.kpi.surcharge": "Qo‘shimcha to‘lov",
      "debts.kpi.overpay": "Oshiqcha to‘lov",
      "debts.dynamics": "Qarzdorlik dinamikasi",
      "debts.series.debt": "Qarzdorlik",
      "debts.series.surcharge": "Qo‘shimcha to‘lov",
      "debts.series.overpay": "Oshiqcha to‘lov",
      "debts.table.title": "Qarzdorlik yozuvlari",
      "debts.counterparty": "Kontragent",

      /* Utilities */
      "util.service": "Xizmat turi",
      "util.consumption": "Sarf",
      "util.cost": "Xarajat",
      "util.electricity": "Elektr energiyasi",
      "util.gas": "Tabiiy gaz",
      "util.water": "Suv va kanalizatsiya",
      "util.heating": "Issiqlik ta’minoti",
      "util.internet": "Internet va aloqa",
      "util.by_service": "Xizmat turi bo‘yicha xarajat",

      /* Material */
      "material.transport": "Transport vositalari",
      "material.by_model": "Model / tur bo‘yicha taqsimot",
      "material.buildings": "Binolar va inshootlar",
      "material.equipment": "Jihozlar",
      "material.model": "Model",
      "material.type": "Turi",
      "material.year": "Ishlab chiqarilgan yili",
      "material.plate": "Davlat raqami",
      "veh.ambulance": "Tez yordam",
      "veh.car": "Yengil avtomobil",
      "veh.bus": "Avtobus",
      "veh.truck": "Yuk mashinasi",

      /* Health */
      "health.beds": "Shifo o‘rinlari",
      "health.bedday_plan": "O‘rin-kun rejasi",
      "health.bedday_fact": "O‘rin-kun bajarilishi",
      "health.patients": "Davolangan bemorlar",
      "health.bedday_exec": "O‘rin-kun ijrosi",
      "health.stationary": "Statsionar",
      "health.ambulatory": "Ambulator",
      "health.metric": "Ko‘rsatkich",
      "health.plan": "Reja",
      "health.fact": "Bajarilishi",
      "health.by_type": "Byudjet / Pullik / Jami kesimida",

      /* Chart axis / misc */
      "chart.months": "Oylar",
      "chart.jan": "Yan", "chart.feb": "Fev", "chart.mar": "Mar", "chart.apr": "Apr",
      "chart.may": "May", "chart.jun": "Iyun", "chart.jul": "Iyul", "chart.aug": "Avg",
      "chart.sep": "Sen", "chart.oct": "Okt", "chart.nov": "Noy", "chart.dec": "Dek"
    }
  };

  /* ---- uz-cyrl (Uzbek Cyrillic) ---- */
  DICT["uz-cyrl"] = {
    "app.name": "Бюджет Паспорт", "app.subtitle": "Ташкилот кабинети",
    "app.org": "Тошкент тиббиёт муассасаси", "app.org_short": "ТТМ #7",
    "lang.uz-latn": "O‘zbekcha (lotin)", "lang.uz-cyrl": "Ўзбекча (кирилл)", "lang.ru": "Русский",
    "lang.label": "Тил", "theme.label": "Мавзу", "theme.light": "Ёруғ", "theme.dark": "Тунги", "theme.toggle": "Мавзуни алмаштириш",
    "nav.menu": "Меню",
    "nav.general": "Умумий маълумот", "nav.location": "Жойлашув", "nav.staff": "Кадрлар билан ишлаш",
    "nav.material": "Моддий техник база", "nav.utilities": "Коммунал харажатлар", "nav.debts": "Мавжуд қарзлар",
    "nav.mib": "Тиббий суғурта (МИБ)", "nav.health": "Соғлиқни сақлаш",
    "common.actions": "Амаллар", "common.edit": "Таҳрирлаш", "common.save": "Сақлаш", "common.cancel": "Бекор қилиш",
    "common.close": "Ёпиш", "common.add": "Қўшиш", "common.total": "Жами", "common.category": "Тоифа",
    "common.name": "Номи", "common.count": "Сони", "common.amount": "Сумма", "common.date": "Сана",
    "common.status": "Ҳолати", "common.percent": "Фоиз", "common.chart_view": "Чарт кўриниши",
    "common.table_view": "Жадвал кўриниши", "common.currency": "сўм", "common.people": "киши",
    "common.units": "дона", "common.export": "Экспорт", "common.print": "Чоп этиш", "common.updated": "Янгиланган", "common.of_plan": "режадан",
    "empty.title": "Маълумот мавжуд эмас", "empty.desc": "Бу бўлим учун ҳозирча ёзувлар киритилмаган.", "empty.cta": "Маълумот қўшиш",
    "status.new": "Янги", "status.active": "Фаол", "status.pending": "Кутилмоқда", "status.closed": "Ёпилган", "status.overdue": "Муддати ўтган",
    "page.general.title": "Умумий маълумот", "page.general.desc": "Ташкилотнинг асосий, алоқа ва молиявий кўрсаткичлари.",
    "page.location.title": "Жойлашув", "page.location.desc": "Ташкилот манзили ва ҳудудий бўлинмалари.",
    "page.staff.title": "Кадрлар билан ишлаш", "page.staff.desc": "Штат бирликлари, банд ва вакант лавозимлар тақсимоти.",
    "page.material.title": "Моддий техник база", "page.material.desc": "Бино, жиҳоз ва транспорт воситалари.",
    "page.utilities.title": "Коммунал харажатлар", "page.utilities.desc": "Коммунал ва алоқа хизматлари сарфи.",
    "page.debts.title": "Мавжуд қарзлар", "page.debts.desc": "Қарздорлик, қўшимча ва ошиқча тўловлар динамикаси.",
    "page.mib.title": "Тиббий суғурта / Маблағ", "page.mib.desc": "Бюджет ва пуллик маблағлар ҳаракати.",
    "page.health.title": "Соғлиқни сақлаш", "page.health.desc": "Стационар ва амбулатор кўрсаткичлар.",
    "general.kpi.staff_total": "Жами штат", "general.kpi.occupied": "Банд лавозим", "general.kpi.vacant": "Вакант", "general.kpi.debt": "Умумий қарздорлик",
    "general.basic": "Асосий маълумотлар", "general.contact": "Алоқа маълумотлари", "general.insurance": "Тиббий суғурта / Маблағ",
    "general.f.name": "Ташкилот номи", "general.f.inn": "СТИР (ИНН)", "general.f.type": "Ташкилот тури", "general.f.region": "Ҳудуд",
    "general.f.head": "Раҳбар", "general.f.founded": "Ташкил этилган йил", "general.f.phone": "Телефон", "general.f.email": "Электрон почта",
    "general.f.address": "Манзил", "general.f.website": "Веб-сайт", "general.type.medical": "Тиббиёт муассасаси",
    "mib.start_balance": "Йил боши қолдиқ", "mib.income": "Жами тушум", "mib.expense": "Касса харажати", "mib.end_balance": "Ҳисобот охири қолдиқ",
    "mib.budget": "Бюджет", "mib.paid": "Пуллик", "mib.source": "Тушум манбаи", "mib.by_source": "Тушум манбалари бўйича", "mib.movement": "Маблағ ҳаракати",
    "src.state": "Давлат бюджети", "src.paid_services": "Пуллик хизматлар", "src.insurance": "Суғурта тўловлари", "src.grants": "Грант ва ёрдам",
    "staff.by_position": "Штат лавозимлар тақсимоти", "staff.compare": "Штат / Банд / Вакант солиштируви", "staff.by_tarif": "Таъриф рўйхати бўйича лавозимлар",
    "staff.cat.management": "Бошқарув", "staff.cat.production": "Ишлаб чиқариш", "staff.cat.technical": "Техник ходимлар",
    "staff.col.staff": "Штат бўйича", "staff.col.occupied": "Банд бўлган", "staff.col.vacant": "Вакант",
    "staff.tarif.others": "Бошқалар", "staff.tarif.junior_med": "Кичик тиббий", "staff.tarif.mid_med": "Ўрта тиббий", "staff.tarif.pedagog": "Педагогик", "staff.tarif.doctors": "Врачлар",
    "debts.kpi.debt": "Қарздорлик", "debts.kpi.surcharge": "Қўшимча тўлов", "debts.kpi.overpay": "Ошиқча тўлов",
    "debts.dynamics": "Қарздорлик динамикаси", "debts.series.debt": "Қарздорлик", "debts.series.surcharge": "Қўшимча тўлов", "debts.series.overpay": "Ошиқча тўлов",
    "debts.table.title": "Қарздорлик ёзувлари", "debts.counterparty": "Контрагент",
    "util.service": "Хизмат тури", "util.consumption": "Сарф", "util.cost": "Харажат", "util.electricity": "Электр энергияси",
    "util.gas": "Табиий газ", "util.water": "Сув ва канализация", "util.heating": "Иссиқлик таъминоти", "util.internet": "Интернет ва алоқа", "util.by_service": "Хизмат тури бўйича харажат",
    "material.transport": "Транспорт воситалари", "material.by_model": "Модель / тур бўйича тақсимот", "material.buildings": "Бинолар ва иншоотлар",
    "material.equipment": "Жиҳозлар", "material.model": "Модель", "material.type": "Тури", "material.year": "Ишлаб чиқарилган йили", "material.plate": "Давлат рақами",
    "veh.ambulance": "Тез ёрдам", "veh.car": "Енгил автомобиль", "veh.bus": "Автобус", "veh.truck": "Юк машинаси",
    "health.beds": "Шифо ўринлари", "health.bedday_plan": "Ўрин-кун режаси", "health.bedday_fact": "Ўрин-кун бажарилиши", "health.patients": "Даволанган беморлар",
    "health.bedday_exec": "Ўрин-кун ижроси", "health.stationary": "Стационар", "health.ambulatory": "Амбулатор", "health.metric": "Кўрсаткич",
    "health.plan": "Режа", "health.fact": "Бажарилиши", "health.by_type": "Бюджет / Пуллик / Жами кесимида",
    "chart.months": "Ойлар",
    "chart.jan": "Ян", "chart.feb": "Фев", "chart.mar": "Мар", "chart.apr": "Апр", "chart.may": "Май", "chart.jun": "Июн",
    "chart.jul": "Июл", "chart.aug": "Авг", "chart.sep": "Сен", "chart.oct": "Окт", "chart.nov": "Ноя", "chart.dec": "Дек"
  };

  /* ---- ru (Russian) ---- */
  DICT["ru"] = {
    "app.name": "Бюджет Паспорт", "app.subtitle": "Кабинет организации",
    "app.org": "Ташкентское медицинское учреждение", "app.org_short": "ТМУ #7",
    "lang.uz-latn": "O‘zbekcha (lotin)", "lang.uz-cyrl": "Ўзбекча (кирилл)", "lang.ru": "Русский",
    "lang.label": "Язык", "theme.label": "Тема", "theme.light": "Светлая", "theme.dark": "Тёмная", "theme.toggle": "Переключить тему",
    "nav.menu": "Меню",
    "nav.general": "Общая информация", "nav.location": "Расположение", "nav.staff": "Работа с кадрами",
    "nav.material": "Материально-техническая база", "nav.utilities": "Коммунальные расходы", "nav.debts": "Текущие задолженности",
    "nav.mib": "Медицинское страхование (МСБ)", "nav.health": "Здравоохранение",
    "common.actions": "Действия", "common.edit": "Редактировать", "common.save": "Сохранить", "common.cancel": "Отмена",
    "common.close": "Закрыть", "common.add": "Добавить", "common.total": "Итого", "common.category": "Категория",
    "common.name": "Наименование", "common.count": "Количество", "common.amount": "Сумма", "common.date": "Дата",
    "common.status": "Статус", "common.percent": "Процент", "common.chart_view": "Вид графика",
    "common.table_view": "Вид таблицы", "common.currency": "сум", "common.people": "чел.",
    "common.units": "шт.", "common.export": "Экспорт", "common.print": "Печать", "common.updated": "Обновлено", "common.of_plan": "от плана",
    "empty.title": "Нет данных", "empty.desc": "Для этого раздела пока нет записей.", "empty.cta": "Добавить данные",
    "status.new": "Новый", "status.active": "Активный", "status.pending": "В ожидании", "status.closed": "Закрыт", "status.overdue": "Просрочен",
    "page.general.title": "Общая информация", "page.general.desc": "Основные, контактные и финансовые показатели организации.",
    "page.location.title": "Расположение", "page.location.desc": "Адрес организации и территориальные подразделения.",
    "page.staff.title": "Работа с кадрами", "page.staff.desc": "Штатные единицы, занятые и вакантные должности.",
    "page.material.title": "Материально-техническая база", "page.material.desc": "Здания, оборудование и транспортные средства.",
    "page.utilities.title": "Коммунальные расходы", "page.utilities.desc": "Расходы на коммунальные услуги и связь.",
    "page.debts.title": "Текущие задолженности", "page.debts.desc": "Динамика задолженности, доплат и переплат.",
    "page.mib.title": "Медстрахование / Средства", "page.mib.desc": "Движение бюджетных и платных средств.",
    "page.health.title": "Здравоохранение", "page.health.desc": "Стационарные и амбулаторные показатели.",
    "general.kpi.staff_total": "Всего штата", "general.kpi.occupied": "Занято", "general.kpi.vacant": "Вакансии", "general.kpi.debt": "Общая задолженность",
    "general.basic": "Основные данные", "general.contact": "Контактные данные", "general.insurance": "Медстрахование / Средства",
    "general.f.name": "Наименование организации", "general.f.inn": "ИНН (СТИР)", "general.f.type": "Тип организации", "general.f.region": "Регион",
    "general.f.head": "Руководитель", "general.f.founded": "Год основания", "general.f.phone": "Телефон", "general.f.email": "Эл. почта",
    "general.f.address": "Адрес", "general.f.website": "Веб-сайт", "general.type.medical": "Медицинское учреждение",
    "mib.start_balance": "Остаток на начало года", "mib.income": "Всего поступлений", "mib.expense": "Кассовый расход", "mib.end_balance": "Остаток на конец отчёта",
    "mib.budget": "Бюджет", "mib.paid": "Платные", "mib.source": "Источник поступления", "mib.by_source": "По источникам поступления", "mib.movement": "Движение средств",
    "src.state": "Госбюджет", "src.paid_services": "Платные услуги", "src.insurance": "Страховые выплаты", "src.grants": "Гранты и помощь",
    "staff.by_position": "Распределение штатных должностей", "staff.compare": "Штат / Занято / Вакансии", "staff.by_tarif": "Должности по тарифной сетке",
    "staff.cat.management": "Управление", "staff.cat.production": "Производство", "staff.cat.technical": "Технический персонал",
    "staff.col.staff": "По штату", "staff.col.occupied": "Занято", "staff.col.vacant": "Вакансии",
    "staff.tarif.others": "Прочие", "staff.tarif.junior_med": "Младший мед.", "staff.tarif.mid_med": "Средний мед.", "staff.tarif.pedagog": "Педагогические", "staff.tarif.doctors": "Врачи",
    "debts.kpi.debt": "Задолженность", "debts.kpi.surcharge": "Доплата", "debts.kpi.overpay": "Переплата",
    "debts.dynamics": "Динамика задолженности", "debts.series.debt": "Задолженность", "debts.series.surcharge": "Доплата", "debts.series.overpay": "Переплата",
    "debts.table.title": "Записи задолженности", "debts.counterparty": "Контрагент",
    "util.service": "Вид услуги", "util.consumption": "Потребление", "util.cost": "Расход", "util.electricity": "Электроэнергия",
    "util.gas": "Природный газ", "util.water": "Вода и канализация", "util.heating": "Теплоснабжение", "util.internet": "Интернет и связь", "util.by_service": "Расходы по видам услуг",
    "material.transport": "Транспортные средства", "material.by_model": "Распределение по модели / типу", "material.buildings": "Здания и сооружения",
    "material.equipment": "Оборудование", "material.model": "Модель", "material.type": "Тип", "material.year": "Год выпуска", "material.plate": "Гос. номер",
    "veh.ambulance": "Скорая помощь", "veh.car": "Легковой автомобиль", "veh.bus": "Автобус", "veh.truck": "Грузовик",
    "health.beds": "Койко-места", "health.bedday_plan": "План койко-дней", "health.bedday_fact": "Факт койко-дней", "health.patients": "Пролечено пациентов",
    "health.bedday_exec": "Исполнение койко-дней", "health.stationary": "Стационар", "health.ambulatory": "Амбулатория", "health.metric": "Показатель",
    "health.plan": "План", "health.fact": "Факт", "health.by_type": "В разрезе Бюджет / Платные / Всего",
    "chart.months": "Месяцы",
    "chart.jan": "Янв", "chart.feb": "Фев", "chart.mar": "Мар", "chart.apr": "Апр", "chart.may": "Май", "chart.jun": "Июн",
    "chart.jul": "Июл", "chart.aug": "Авг", "chart.sep": "Сен", "chart.oct": "Окт", "chart.nov": "Ноя", "chart.dec": "Дек"
  };

  var LANGS = ["uz-latn", "uz-cyrl", "ru"];
  var STORE_KEY = "pb.lang";
  var listeners = [];

  var I18N = {
    langs: LANGS,
    current: "uz-latn",

    init: function () {
      var saved = null;
      try { saved = localStorage.getItem(STORE_KEY); } catch (e) {}
      this.current = LANGS.indexOf(saved) >= 0 ? saved : "uz-latn";
      document.documentElement.setAttribute("lang", this.current.split("-")[0]);
    },

    t: function (key, fallback) {
      var d = DICT[this.current] || {};
      if (d[key] != null) return d[key];
      var base = DICT["uz-latn"];
      if (base[key] != null) return base[key];
      return fallback != null ? fallback : key;
    },

    setLang: function (lang) {
      if (LANGS.indexOf(lang) < 0) return;
      this.current = lang;
      try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
      document.documentElement.setAttribute("lang", lang.split("-")[0]);
      this.apply(document);
      listeners.forEach(function (fn) { try { fn(lang); } catch (e) {} });
    },

    onChange: function (fn) { listeners.push(fn); },

    /* Apply translations to all [data-i18n] within root */
    apply: function (root) {
      root = root || document;
      var nodes = root.querySelectorAll("[data-i18n]");
      nodes.forEach(function (el) {
        el.textContent = I18N.t(el.getAttribute("data-i18n"));
      });
      var attrNodes = root.querySelectorAll("[data-i18n-attr]");
      attrNodes.forEach(function (el) {
        el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
          var kv = pair.split(":");
          if (kv.length === 2) el.setAttribute(kv[0].trim(), I18N.t(kv[1].trim()));
        });
      });
    }
  };

  global.I18N = I18N;
})(window);
