const PRODUCTS = {
  A: { price: 50, icon: "shopping-bag" },
  B: { price: 120, icon: "headphones" },
  C: { price: 80, icon: "watch" },
};
const PLATFORMS = {
  Instagram: { color: "#186344", icon: "instagram" },
  TikTok: { color: "#65a397", icon: null },
  YouTube: { color: "#e3b788", icon: "youtube" },
};
const CAMPAIGNS = [
  {
    id: 1,
    name: "Everyday essentials",
    platform: "Instagram",
    product: "A",
    sales: 168,
    reach: 72000,
    spend: 240,
    posts: 8,
    end: 14,
  },
  {
    id: 2,
    name: "A little everyday luxury",
    platform: "Instagram",
    product: "B",
    sales: 126,
    reach: 52000,
    spend: 410,
    posts: 6,
    end: 14,
  },
  {
    id: 3,
    name: "The weekend edit",
    platform: "Instagram",
    product: "C",
    sales: 109,
    reach: 48000,
    spend: 270,
    posts: 5,
    end: 12,
  },
  {
    id: 4,
    name: "Your next favorite",
    platform: "TikTok",
    product: "A",
    sales: 143,
    reach: 98000,
    spend: 190,
    posts: 10,
    end: 14,
  },
  {
    id: 5,
    name: "Worth the hype",
    platform: "TikTok",
    product: "B",
    sales: 82,
    reach: 84000,
    spend: 280,
    posts: 7,
    end: 14,
  },
  {
    id: 6,
    name: "Get ready with me",
    platform: "TikTok",
    product: "C",
    sales: 94,
    reach: 67000,
    spend: 215,
    posts: 8,
    end: 14,
  },
  {
    id: 7,
    name: "My October favorites",
    platform: "YouTube",
    product: "A",
    sales: 56,
    reach: 27000,
    spend: 110,
    posts: 3,
    end: 10,
  },
  {
    id: 8,
    name: "The honest review",
    platform: "YouTube",
    product: "B",
    sales: 117,
    reach: 39000,
    spend: 330,
    posts: 4,
    end: 14,
  },
  {
    id: 9,
    name: "A week of first impressions",
    platform: "YouTube",
    product: "C",
    sales: 34,
    reach: 36000,
    spend: 430,
    posts: 3,
    end: 14,
  },
];
const euro = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const integer = new Intl.NumberFormat("en-GB");
const percent = (value) => `${value.toFixed(2)}%`;
const money = (value) => euro.format(value);
const compact = (value) =>
  new Intl.NumberFormat("en-GB", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
const ratio = (numerator, denominator) =>
  denominator ? numerator / denominator : 0;
const icon = (name) => `<i data-lucide="${name}"></i>`;
const platformIcon = (name) =>
  PLATFORMS[name].icon
    ? icon(PLATFORMS[name].icon)
    : '<span class="tiktok-mark" aria-hidden="true">♪</span>';
const state = {
  days: 14,
  platform: "all",
  product: "all",
  tab: "campaigns",
  search: "",
  sort: "commission",
  metric: "commission",
};
let earningsChart;
let platformChart;
let toastTimer;

function makeRecords() {
  const records = [];
  CAMPAIGNS.forEach((campaign) => {
    for (let offset = 0; offset < 28; offset++) {
      const date = new Date(Date.UTC(2026, 8, 17 + offset));
      const current = offset >= 14;
      const day = current ? offset - 14 : offset;
      if (current && day >= campaign.end) continue;
      const days = current ? campaign.end : 14;
      const weight = 0.65 + ((day * 3 + campaign.id * 2) % 9) / 10;
      const sales = Math.round(
        (campaign.sales / days) * weight * (current ? 1 : 0.79),
      );
      const reach = Math.round(
        (campaign.reach / days) * weight * (current ? 1 : 0.87),
      );
      const engagementRate =
        campaign.platform === "TikTok"
          ? 0.073
          : campaign.platform === "Instagram"
            ? 0.057
            : 0.041;
      const interactions = Math.round(reach * engagementRate);
      const likes = Math.round(interactions * 0.74);
      const comments = Math.round(interactions * 0.08);
      const shares = Math.round(interactions * 0.11);
      const clicks = Math.max(
        sales,
        Math.round(reach * (campaign.platform === "YouTube" ? 0.052 : 0.035)),
      );
      const checkouts = Math.max(sales, Math.round(clicks * 0.19));
      const revenue = sales * PRODUCTS[campaign.product].price;
      const posts =
        Math.floor(((day + 1) * campaign.posts) / days) -
        Math.floor((day * campaign.posts) / days);
      records.push({
        campaign: campaign.id,
        platform: campaign.platform,
        product: campaign.product,
        date: date.toISOString().slice(0, 10),
        sales,
        reach,
        impressions: Math.round(reach * 1.35),
        clicks,
        checkouts,
        likes,
        comments,
        shares,
        saves: interactions - likes - comments - shares,
        interactions,
        revenue,
        commission: revenue * 0.15,
        spend: (campaign.spend / days) * (current ? 1 : 0.92),
        posts,
      });
    }
  });
  return records;
}
const RECORDS = makeRecords();

function selectRecords(previous = false) {
  const end = new Date(Date.UTC(2026, 9, 15 - (previous ? state.days : 0)));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - state.days);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);
  return RECORDS.filter(
    (record) =>
      record.date >= startDate &&
      record.date < endDate &&
      (state.platform === "all" || record.platform === state.platform) &&
      (state.product === "all" || record.product === state.product),
  );
}

function aggregate(records) {
  const totals = {
    sales: 0,
    reach: 0,
    impressions: 0,
    clicks: 0,
    checkouts: 0,
    interactions: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    revenue: 0,
    commission: 0,
    spend: 0,
    posts: 0,
  };
  records.forEach((record) =>
    Object.keys(totals).forEach((key) => (totals[key] += record[key])),
  );
  return {
    ...totals,
    conversion: ratio(totals.sales, totals.reach) * 100,
    engagement: ratio(totals.interactions, totals.reach) * 100,
    roi: ratio(totals.commission - totals.spend, totals.spend) * 100,
    returnMultiple: ratio(totals.commission, totals.spend),
    ctr: ratio(totals.clicks, totals.impressions) * 100,
  };
}

function groupRows(records, key) {
  return [...new Set(records.map((record) => record[key]))].map((name) => ({
    name,
    ...aggregate(records.filter((record) => record[key] === name)),
  }));
}

function trend(current, previous, points = false) {
  const change = points
    ? current - previous
    : ratio(current - previous, previous) * 100;
  const label =
    !previous && !points
      ? "No prior data"
      : `${change >= 0 ? "+" : ""}${change.toFixed(points ? 2 : 1)}${points ? " pp" : "%"}`;
  return `<span class="trend ${change < 0 ? "negative" : ""}">${icon(change < 0 ? "arrow-down-right" : "arrow-up-right")}${label}</span>`;
}

function renderKpis(totals, previous) {
  const metrics = [
    {
      title: "Total commissions",
      value: money(totals.commission),
      metric: "commission",
      icon: "wallet",
      detail: "15% of attributed sales revenue",
      featured: true,
    },
    {
      title: "Total conversions",
      value: integer.format(totals.sales),
      metric: "sales",
      icon: "shopping-bag",
      detail: `${money(totals.revenue)} in sales revenue`,
    },
    {
      title: "Conversion rate",
      value: percent(totals.conversion),
      metric: "conversion",
      icon: "mouse-pointer-2",
      detail: `${compact(totals.reach)} reported reach`,
      points: true,
    },
    {
      title: "Return on ad spend",
      value: `${totals.returnMultiple.toFixed(2)}x`,
      metric: "returnMultiple",
      icon: "trending-up",
      detail: `${money(totals.spend)} ad spend · ${totals.roi.toFixed(1)}% ROI`,
    },
  ];
  document.querySelector("#kpis").innerHTML = metrics
    .map(
      (metric) =>
        `<article class="kpi ${metric.featured ? "featured" : ""}"><div class="kpi-heading"><span>${metric.title}</span>${icon(metric.icon)}</div><div class="kpi-value">${metric.value}</div><div class="kpi-bottom">${trend(totals[metric.metric], previous[metric.metric], metric.points)}<span>vs. previous period</span></div><div class="kpi-context">${metric.detail}</div></article>`,
    )
    .join("");
}

function renderCharts(records, previousRecords, totals, previous) {
  document.querySelector("#chart-total").textContent = money(
    totals[state.metric],
  );
  document.querySelector("#chart-change").innerHTML = trend(
    totals[state.metric],
    previous[state.metric],
  );
  document.querySelector("#donut-total").textContent = money(totals.commission);
  const platforms = groupRows(records, "platform").sort(
    (first, second) => second.commission - first.commission,
  );
  document.querySelector("#platform-count").textContent = platforms.length;
  document.querySelector("#platform-legend").innerHTML = platforms
    .map(
      (platform) =>
        `<div class="platform-row"><span class="legend-dot" style="background:${PLATFORMS[platform.name].color}"></span><span>${platform.name}</span><strong>${money(platform.commission)}</strong><span>${Math.round(ratio(platform.commission, totals.commission) * 100)}%</span></div>`,
    )
    .join("");
  if (!window.Chart) {
    document.querySelector(".chart-fallback").hidden = false;
    return;
  }
  const labels = Array.from(
    { length: state.days },
    (_, index) => `Oct ${15 - state.days + index}`,
  );
  const daily = (data, prior) =>
    labels.map((_, index) => {
      const date = new Date(
        Date.UTC(2026, 9, 15 - state.days + index - (prior ? state.days : 0)),
      )
        .toISOString()
        .slice(0, 10);
      return aggregate(data.filter((record) => record.date === date))[
        state.metric
      ];
    });
  const datasets = [
    {
      label: "Current period",
      data: daily(records, false),
      borderColor: "#216d4c",
      backgroundColor: "#216d4c0b",
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.35,
      fill: true,
    },
    {
      label: "Previous period",
      data: daily(previousRecords, true),
      borderColor: "#c2cdb5",
      borderWidth: 1.5,
      borderDash: [4, 4],
      pointRadius: 0,
      tension: 0.35,
    },
  ];
  if (earningsChart) {
    earningsChart.data = { labels, datasets };
    earningsChart.update();
  } else {
    earningsChart = new Chart(document.querySelector("#earnings-chart"), {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: !matchMedia("(prefers-reduced-motion: reduce)").matches,
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#234e38",
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (context) =>
                `${context.dataset.label}: ${money(context.raw)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: "#a0a794",
              maxTicksLimit: 7,
              maxRotation: 0,
              font: { family: "DM Sans", size: 9 },
            },
          },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: "#f0f2eb", drawTicks: false },
            ticks: {
              color: "#a0a794",
              padding: 10,
              maxTicksLimit: 5,
              font: { family: "DM Sans", size: 9 },
              callback: (value) => money(value),
            },
          },
        },
      },
    });
  }
  const donutData = {
    labels: platforms.map((platform) => platform.name),
    datasets: [
      {
        data: platforms.map((platform) => platform.commission),
        backgroundColor: platforms.map(
          (platform) => PLATFORMS[platform.name].color,
        ),
        borderWidth: 4,
        borderColor: "#fff",
        borderRadius: 4,
        hoverOffset: 3,
      },
    ],
  };
  if (platformChart) {
    platformChart.data = donutData;
    platformChart.update();
  } else {
    platformChart = new Chart(document.querySelector("#platform-chart"), {
      type: "doughnut",
      data: donutData,
      options: {
        cutout: "83%",
        responsive: true,
        maintainAspectRatio: false,
        animation: !matchMedia("(prefers-reduced-motion: reduce)").matches,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (context) => ` ${money(context.raw)}` },
          },
        },
      },
    });
  }
}

function renderDrivers(records, totals) {
  const products = groupRows(records, "product").sort(
    (first, second) => second.commission - first.commission,
  );
  document.querySelector("#product-ranking").innerHTML = products
    .map(
      (product) =>
        `<div class="product-row"><span class="product-tile product-${product.name.toLowerCase()}">${icon(PRODUCTS[product.name].icon)}</span><div class="product-info"><strong>Product ${product.name}</strong><small>${money(PRODUCTS[product.name].price)} · ${integer.format(product.sales)} sales</small><div class="rank-bar"><span style="width:${ratio(product.commission, products[0].commission) * 100}%"></span></div></div><div class="product-earnings"><strong>${money(product.commission)}</strong><small>${percent(product.engagement)} engagement</small></div></div>`,
    )
    .join("");
  const stages = [
    { title: "Reach", value: totals.reach },
    { title: "Clicks", value: totals.clicks },
    { title: "Checkouts", value: totals.checkouts },
    { title: "Sales", value: totals.sales },
  ];
  document.querySelector("#funnel").innerHTML = stages
    .map(
      (stage) =>
        `<div class="funnel-row"><span class="funnel-label">${stage.title}</span><div class="funnel-track" title="${integer.format(stage.value)} ${stage.title.toLowerCase()} · ${percent(ratio(stage.value, totals.reach) * 100)} of reach"><span style="width:${ratio(stage.value, totals.reach) * 100}%"></span></div><strong>${compact(stage.value)}</strong></div>`,
    )
    .join("");
  document.querySelector("#funnel-rate").textContent = percent(
    totals.conversion,
  );
  const platforms = groupRows(records, "platform").sort(
    (first, second) => second.returnMultiple - first.returnMultiple,
  );
  const campaigns = groupRows(records, "campaign").sort(
    (first, second) => first.roi - second.roi,
  );
  const weakest = campaigns[0];
  const strongest = platforms[0];
  document.querySelector("#insights").innerHTML =
    `<article class="insight-item"><h3>${strongest.name} makes your budget go further</h3><p>${strongest.returnMultiple.toFixed(2)}x commission return on ad spend. ${state.platform === "all" ? "Your best-performing platform for return." : "Return for the selected platform."}</p></article><article class="insight-item ${weakest.roi < 0 ? "caution" : ""}"><h3>${weakest.roi < 0 ? "A campaign needs a closer look" : "Your product to watch"}</h3><p>${weakest.roi < 0 ? `${CAMPAIGNS.find((campaign) => campaign.id === weakest.name).name} has ${weakest.roi.toFixed(1)}% ROI. Commissions are below ad spend.` : `Product ${products[0].name} leads with ${money(products[0].commission)} in commissions and ${percent(products[0].conversion)} conversion.`}</p></article>`;
  const priorConversion = aggregate(selectRecords(true)).conversion;
  const conversionChange =
    ratio(totals.conversion - priorConversion, priorConversion) * 100;
  const alertTitle =
    conversionChange <= -20
      ? "Conversion drop detected"
      : conversionChange >= 20
        ? "Conversion spike detected"
        : "Conversion is holding steady";
  document.querySelector("#insights").innerHTML +=
    `<article class="insight-item ${conversionChange <= -20 ? "caution" : ""}"><h3>${alertTitle}</h3><p>${conversionChange >= 0 ? "+" : ""}${conversionChange.toFixed(1)}% relative to the previous ${state.days} days. ${Math.abs(conversionChange) >= 20 ? "A change above the 20% alert threshold." : "No change beyond the 20% alert threshold."}</p></article>`;
  const support = [
    [
      "Engagement rate",
      percent(totals.engagement),
      `${compact(totals.interactions)} interactions / reach`,
    ],
    [
      "Click-through rate",
      percent(totals.ctr),
      `${integer.format(totals.clicks)} clicks / impressions`,
    ],
    [
      "Checkout completion",
      percent(ratio(totals.sales, totals.checkouts) * 100),
      `${integer.format(totals.checkouts)} checkouts started`,
    ],
    [
      "Content published",
      integer.format(totals.posts),
      `${compact(totals.likes)} likes · ${compact(totals.comments)} comments · ${compact(totals.shares)} shares · ${compact(totals.saves)} saves`,
    ],
  ];
  document.querySelector("#additional-metrics").innerHTML = support
    .map(
      ([label, value, context]) =>
        `<div class="support-metric"><span>${label}</span><strong>${value}</strong><small>${context}</small></div>`,
    )
    .join("");
}

function detailRows(records) {
  const key =
    state.tab === "campaigns"
      ? "campaign"
      : state.tab === "products"
        ? "product"
        : "platform";
  return groupRows(records, key)
    .map((row) => {
      if (state.tab === "campaigns") {
        const campaign = CAMPAIGNS.find((item) => item.id === row.name);
        return {
          ...row,
          label: campaign.name,
          platform: campaign.platform,
          product: campaign.product,
          end: campaign.end,
          status:
            row.roi < 0
              ? "Needs attention"
              : campaign.end < 14
                ? "Completed"
                : "Active",
        };
      }
      return {
        ...row,
        label: state.tab === "products" ? `Product ${row.name}` : row.name,
      };
    })
    .filter((row) =>
      `${row.label} ${row.platform || ""} ${row.product || ""} ${row.status || ""}`
        .toLowerCase()
        .includes(state.search.toLowerCase()),
    )
    .sort((first, second) => second[state.sort] - first[state.sort]);
}

function renderTable(records) {
  const campaigns = state.tab === "campaigns";
  const products = state.tab === "products";
  const headings = campaigns
    ? [
        "Campaign",
        "Platform",
        "Product",
        "Reach",
        "Conversions",
        "Commissions",
        "ROI",
        "Status",
      ]
    : products
      ? [
          "Product",
          "Price",
          "Sales revenue",
          "Conversions",
          "Commissions",
          "Conversion",
          "Engagement",
          "ROI",
        ]
      : [
          "Platform",
          "Reach",
          "Engagement",
          "Conversions",
          "Commissions",
          "Ad spend",
          "Conversion",
          "CTR",
          "Posts",
          "Likes",
          "Comments",
          "Shares",
          "Saves",
          "Return",
          "ROI",
        ];
  document.querySelector("#report-head").innerHTML =
    `<tr>${headings.map((heading) => `<th scope="col">${heading}</th>`).join("")}</tr>`;
  const rows = detailRows(records);
  document.querySelector("#report-body").innerHTML = rows.length
    ? rows
        .map((row) => {
          if (campaigns)
            return `<tr><td><strong class="campaign-name">${row.label}</strong><span class="campaign-date">Oct ${15 - state.days} - ${row.end}, 2026</span></td><td><span class="platform-cell">${platformIcon(row.platform)}${row.platform}</span></td><td>Product ${row.product}</td><td>${compact(row.reach)}</td><td>${integer.format(row.sales)}</td><td class="money-cell">${money(row.commission)}</td><td class="${row.roi < 0 ? "negative-text" : ""}">${row.roi.toFixed(1)}%</td><td><span class="badge ${row.status === "Needs attention" ? "warning" : row.status === "Completed" ? "neutral" : ""}">${row.status === "Active" ? '<span class="status-dot"></span>' : ""}${row.status}</span></td></tr>`;
          if (products)
            return `<tr><td><strong>${row.label}</strong></td><td>${money(PRODUCTS[row.name].price)}</td><td>${money(row.revenue)}</td><td>${integer.format(row.sales)}</td><td class="money-cell">${money(row.commission)}</td><td>${percent(row.conversion)}</td><td>${percent(row.engagement)}</td><td class="${row.roi < 0 ? "negative-text" : ""}">${row.roi.toFixed(1)}%</td></tr>`;
          return `<tr><td><span class="platform-cell">${platformIcon(row.name)}<strong>${row.label}</strong></span></td><td>${compact(row.reach)}</td><td>${percent(row.engagement)}</td><td>${integer.format(row.sales)}</td><td class="money-cell">${money(row.commission)}</td><td>${money(row.spend)}</td><td>${percent(row.conversion)}</td><td>${percent(row.ctr)}</td><td>${integer.format(row.posts)}</td><td>${integer.format(row.likes)}</td><td>${integer.format(row.comments)}</td><td>${integer.format(row.shares)}</td><td>${integer.format(row.saves)}</td><td>${row.returnMultiple.toFixed(2)}x</td><td class="${row.roi < 0 ? "negative-text" : ""}">${row.roi.toFixed(1)}%</td></tr>`;
        })
        .join("")
    : `<tr><td colspan="${headings.length}" class="empty-state">No matching results. Try another search.</td></tr>`;
  document.querySelector("#row-count").textContent =
    `Showing ${rows.length} ${state.tab}`;
  document
    .querySelector("#table-panel")
    .setAttribute("aria-labelledby", `tab-${state.tab}`);
  document.querySelectorAll("[data-tab]").forEach((button) => {
    const selected = button.dataset.tab === state.tab;
    button.setAttribute("aria-selected", selected);
    button.tabIndex = selected ? 0 : -1;
  });
  document.querySelector("#table-search").placeholder =
    `Search ${state.tab}...`;
  refreshIcons();
}

function refreshIcons() {
  if (window.lucide) lucide.createIcons();
}

function render() {
  const records = selectRecords();
  const previousRecords = selectRecords(true);
  const totals = aggregate(records);
  const previous = aggregate(previousRecords);
  document.querySelector("#comparison-days").textContent = state.days;
  document.querySelector('[data-tab="campaigns"] span').textContent = new Set(
    records.map((record) => record.campaign),
  ).size;
  renderKpis(totals, previous);
  renderCharts(records, previousRecords, totals, previous);
  renderDrivers(records, totals);
  renderTable(records);
}

function setTab(tab) {
  state.tab = tab;
  state.search = "";
  document.querySelector("#table-search").value = "";
  renderTable(selectRecords());
}

document.querySelector("#period-filter").addEventListener("change", (event) => {
  state.days = Number(event.target.value);
  render();
});
document
  .querySelector("#platform-filter")
  .addEventListener("change", (event) => {
    state.platform = event.target.value;
    render();
  });
document
  .querySelector("#product-filter")
  .addEventListener("change", (event) => {
    state.product = event.target.value;
    render();
  });
document.querySelector("#chart-metric").addEventListener("change", (event) => {
  state.metric = event.target.value;
  render();
});
document.querySelector("#table-search").addEventListener("input", (event) => {
  state.search = event.target.value;
  renderTable(selectRecords());
});
document.querySelector("#table-sort").addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderTable(selectRecords());
});
document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => setTab(button.dataset.tab));
  button.addEventListener("keydown", (event) => {
    const tabs = [...document.querySelectorAll("[data-tab]")];
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (tabs.indexOf(button) +
              (event.key === "ArrowRight" ? 1 : -1) +
              tabs.length) %
            tabs.length;
    setTab(tabs[next].dataset.tab);
    tabs[next].focus();
  });
});
document.querySelectorAll("[data-nav]").forEach((link) =>
  link.addEventListener("click", () => {
    document
      .querySelectorAll("[data-nav]")
      .forEach((item) => item.classList.toggle("active", item === link));
    document.querySelector(".breadcrumb strong").textContent =
      link.dataset.nav === "overview"
        ? "Overview"
        : link.dataset.nav[0].toUpperCase() + link.dataset.nav.slice(1);
    if (link.dataset.nav !== "overview") setTab(link.dataset.nav);
  }),
);

document.querySelector("#export-button").addEventListener("click", () => {
  const records = selectRecords();
  const grouped = groupRows(records, "campaign");
  const headers = [
    "Campaign",
    "Platform",
    "Product",
    "Period start",
    "Period end",
    "Price EUR",
    "Reach",
    "Impressions",
    "Sales",
    "Sales revenue EUR",
    "Commission EUR",
    "Ad spend EUR",
    "ROI percent",
    "Conversion percent",
    "Engagement percent",
    "Clicks",
    "Checkouts",
    "Posts",
    "Likes",
    "Comments",
    "Shares",
    "Saves",
  ];
  const rows = grouped.map((row) => {
    const campaign = CAMPAIGNS.find((item) => item.id === row.name);
    return [
      campaign.name,
      campaign.platform,
      `Product ${campaign.product}`,
      `2026-10-${String(15 - state.days).padStart(2, "0")}`,
      "2026-10-14",
      PRODUCTS[campaign.product].price,
      row.reach,
      row.impressions,
      row.sales,
      row.revenue.toFixed(2),
      row.commission.toFixed(2),
      row.spend.toFixed(2),
      row.roi.toFixed(2),
      row.conversion.toFixed(4),
      row.engagement.toFixed(4),
      row.clicks,
      row.checkouts,
      row.posts,
      row.likes,
      row.comments,
      row.shares,
      row.saves,
    ];
  });
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bloom-report-${state.days}days-${state.platform}-${state.product}.csv`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  const toast = document.querySelector("#toast");
  toast.textContent =
    "Report exported with your current period, platform, and product filters.";
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 4000);
});

render();
