/* ==========================================================================
   Mock data (single organization). Structured so a future Admin role can
   swap this for a multi-org array without changing components.
   Labels use i18n keys where the value is a known enum; free text stays plain.
   ========================================================================== */
(function (global) {
  "use strict";

  var MONTHS = ["chart.jan", "chart.feb", "chart.mar", "chart.apr", "chart.may", "chart.jun",
    "chart.jul", "chart.aug", "chart.sep", "chart.oct", "chart.nov", "chart.dec"];

  global.DATA = {
    meta: { orgId: "ttm-7", reportYear: 2025, updatedAt: "2025-12-31" },
    monthKeys: MONTHS,

    general: {
      basic: [
        { key: "general.f.name", value: "app.org", i18nValue: true },
        { key: "general.f.inn", value: "301 245 678" },
        { key: "general.f.type", value: "general.type.medical", i18nValue: true },
        { key: "general.f.region", value: "Toshkent shahri, Yunusobod tumani", ru: "г. Ташкент, Юнусабадский район", cyr: "Тошкент шаҳри, Юнусобод тумани" },
        { key: "general.f.head", value: "A. R. Karimov" },
        { key: "general.f.founded", value: "1998" }
      ],
      contact: [
        { key: "general.f.phone", value: "+998 71 234 56 78" },
        { key: "general.f.email", value: "info@ttm7.uz" },
        { key: "general.f.address", value: "Toshkent sh., Amir Temur ko‘chasi, 108", ru: "г. Ташкент, ул. Амира Темура, 108", cyr: "Тошкент ш., Амир Темур кўчаси, 108" },
        { key: "general.f.website", value: "ttm7.uz" }
      ],
      kpi: { staffTotal: 420, occupied: 372, vacant: 48, debt: 1250468378.95 }
    },

    // Money movement (Tibbiy sug'urta / Mablag')
    mib: {
      movement: [
        { key: "mib.start_balance", budget: 4200000000, paid: 1850000000 },
        { key: "mib.income", budget: 18450000000, paid: 7320000000 },
        { key: "mib.expense", budget: 17100000000, paid: 6980000000 },
        { key: "mib.end_balance", budget: 5550000000, paid: 2190000000 }
      ],
      sources: [
        { key: "src.state", budget: 15200000000, paid: 0 },
        { key: "src.paid_services", budget: 0, paid: 5900000000 },
        { key: "src.insurance", budget: 2600000000, paid: 980000000 },
        { key: "src.grants", budget: 650000000, paid: 440000000 }
      ]
    },

    staff: {
      byPosition: [
        { key: "staff.cat.management", value: 64 },
        { key: "staff.cat.production", value: 268 },
        { key: "staff.cat.technical", value: 88 }
      ],
      compare: [
        { key: "staff.cat.management", staff: 70, occupied: 64, vacant: 6 },
        { key: "staff.cat.production", staff: 290, occupied: 268, vacant: 22 },
        { key: "staff.cat.technical", staff: 100, occupied: 88, vacant: 12 }
      ],
      byTarif: [
        { key: "staff.tarif.doctors", value: 96 },
        { key: "staff.tarif.mid_med", value: 172 },
        { key: "staff.tarif.junior_med", value: 84 },
        { key: "staff.tarif.pedagog", value: 22 },
        { key: "staff.tarif.others", value: 46 }
      ]
    },

    debts: {
      kpi: { debt: 1250468378.95, surcharge: 342180000, overpay: 128940000 },
      series: {
        debt: [980, 1020, 1110, 1180, 1260, 1305, 1290, 1250, 1230, 1275, 1310, 1250].map(function (v) { return v * 1e6; }),
        surcharge: [210, 240, 260, 255, 300, 320, 335, 342, 330, 338, 350, 342].map(function (v) { return v * 1e6; }),
        overpay: [60, 72, 80, 95, 110, 118, 125, 128, 132, 126, 130, 129].map(function (v) { return v * 1e6; })
      },
      rows: [
        { cp: "Toshkent Issiqlik Manbalari", date: "2025-11-30", amount: 420680000, status: "overdue" },
        { cp: "Hududgaz AJ", date: "2025-12-05", amount: 318420000, status: "pending" },
        { cp: "Suvsoz AJ", date: "2025-12-10", amount: 214560000, status: "active" },
        { cp: "Uzbektelekom", date: "2025-12-15", amount: 96808378.95, status: "new" },
        { cp: "Regional Elektr Tarmoqlari", date: "2025-12-20", amount: 199999999, status: "pending" }
      ]
    },

    utilities: {
      rows: [
        { key: "util.electricity", consumption: "482 400 kVt", cost: 1740000000, status: "active" },
        { key: "util.gas", consumption: "128 900 m³", cost: 690000000, status: "active" },
        { key: "util.water", consumption: "34 200 m³", cost: 214000000, status: "pending" },
        { key: "util.heating", consumption: "9 800 Gkal", cost: 1120000000, status: "overdue" },
        { key: "util.internet", consumption: "—", cost: 84000000, status: "active" }
      ]
    },

    material: {
      transport: [
        { key: "veh.ambulance", value: 8 },
        { key: "veh.car", value: 5 },
        { key: "veh.bus", value: 2 },
        { key: "veh.truck", value: 3 }
      ],
      vehicles: [
        { model: "GAZ Sobol 4x4", type: "veh.ambulance", year: 2021, plate: "01 A 234 BC" },
        { model: "Chevrolet Cobalt", type: "veh.car", year: 2022, plate: "01 B 118 AA" },
        { model: "Isuzu Bogdan", type: "veh.bus", year: 2019, plate: "01 C 900 DE" },
        { model: "Ford Transit", type: "veh.ambulance", year: 2023, plate: "01 A 771 KM" },
        { model: "GAZ 3302", type: "veh.truck", year: 2018, plate: "01 D 452 GH" }
      ]
    },

    health: {
      bedByType: {
        labels: ["health.stationary", "health.ambulatory"],
        beds: [180, 0],
        planBedDays: [58800, 0],
        factBedDays: [55400, 0],
        patients: [4820, 18640]
      },
      byBudget: {
        // metric compared across budget / paid / total
        metrics: [
          { key: "health.beds", budget: 150, paid: 30 },
          { key: "health.patients", budget: 3960, paid: 860 }
        ]
      },
      bedDayExecution: 0.942 // 94.2%
    },

    location: {
      address: { value: "Toshkent sh., Amir Temur ko‘chasi, 108", ru: "г. Ташкент, ул. Амира Темура, 108", cyr: "Тошкент ш., Амир Темур кўчаси, 108" },
      lat: 41.311, lng: 69.279,
      branches: [
        { name: "Bosh bino", ru: "Главный корпус", cyr: "Бош бино", area: "6 400 m²", staff: 260 },
        { name: "Poliklinika", ru: "Поликлиника", cyr: "Поликлиника", area: "2 100 m²", staff: 96 },
        { name: "Laboratoriya bloki", ru: "Лабораторный блок", cyr: "Лаборатория блоки", area: "820 m²", staff: 40 }
      ]
    }
  };
})(window);
