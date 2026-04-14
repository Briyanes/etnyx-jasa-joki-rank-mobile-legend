const U = "https://ifjvwxgzcdesykexwyzb.supabase.co";
const K = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmanZ3eGd6Y2Rlc3lrZXh3eXpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk1ODEzNCwiZXhwIjoyMDkwNTM0MTM0fQ.XXtUedzGaf14GTSJaw1sadswze_GKZQd-l5Pt9zcVSQ";
const H = { apikey: K, Authorization: "Bearer " + K, "Content-Type": "application/json", Prefer: "return=minimal" };

const catalog = [
  { id: "promo", title: "Post-Holiday Catch Up", packages: [
    { id: "rush5-epic", title: "Rush 5 Star Epic", price: 32000, originalPrice: 35000, discountPercent: 9, rankKey: "epic", currentRank: "epic", targetRank: "epic" },
    { id: "rush5-legend", title: "Rush 5 Star Legend", price: 37000, originalPrice: 40000, discountPercent: 8, rankKey: "legend", currentRank: "legend", targetRank: "legend" },
    { id: "rush9-epic", title: "Rush 9 Star Epic + Bonus 1", price: 58000, originalPrice: 70000, discountPercent: 17, rankKey: "epic", currentRank: "epic", targetRank: "epic" },
    { id: "rush9-legend", title: "Rush 9 Star Legend + Bonus 1", price: 68000, originalPrice: 80000, discountPercent: 15, rankKey: "legend", currentRank: "legend", targetRank: "legend" },
    { id: "rush5-mythic", title: "Rush 5 Star Mythic", price: 95000, originalPrice: 105000, discountPercent: 10, rankKey: "mythic", currentRank: "mythic", targetRank: "mythic" },
    { id: "rush5-honor", title: "Rush 5 Star Honor", price: 105000, originalPrice: 115000, discountPercent: 9, rankKey: "mythichonor", currentRank: "mythic", targetRank: "mythichonor" },
    { id: "rush5-glory", title: "Rush 5 Star Glory", price: 130000, originalPrice: 137000, discountPercent: 5, rankKey: "mythicglory", currentRank: "mythicglory", targetRank: "mythicglory" },
    { id: "rush9-mythic", title: "Rush 9 Star Mythic + Bonus 1", price: 171000, originalPrice: 211000, discountPercent: 19, rankKey: "mythic", currentRank: "mythic", targetRank: "mythic" },
    { id: "rush9-honor", title: "Rush 9 Star Honor + Bonus 1", price: 189000, originalPrice: 230000, discountPercent: 18, rankKey: "mythichonor", currentRank: "mythic", targetRank: "mythichonor" },
    { id: "rush9-glory", title: "Rush 9 Star Glory + Bonus 1", price: 234000, originalPrice: 275000, discountPercent: 15, rankKey: "mythicglory", currentRank: "mythicglory", targetRank: "mythicglory" },
  ]},
  { id: "paket-warrior", title: "Paket Warrior", packages: [
    { id: "warrior3-elite3", title: "Warrior III - Elite III", price: 25089, rankKey: "warrior", currentRank: "warrior", targetRank: "elite" },
    { id: "warrior3-master4", title: "Warrior III - Master IV", price: 70089, rankKey: "warrior", currentRank: "warrior", targetRank: "master" },
    { id: "warrior3-gm5", title: "Warrior III - GM V", price: 149089, rankKey: "warrior", currentRank: "warrior", targetRank: "grandmaster" },
    { id: "warrior3-epic5", title: "Warrior III - Epic V", price: 282089, rankKey: "warrior", currentRank: "warrior", targetRank: "epic" },
    { id: "warrior3-legend5", title: "Warrior III - Legend V", price: 459089, rankKey: "warrior", currentRank: "warrior", targetRank: "legend" },
    { id: "warrior1-mythic", title: "Warrior I - Mythic", price: 645089, rankKey: "warrior", currentRank: "warrior", targetRank: "mythic" },
    { id: "warrior2-mythic", title: "Warrior II - Mythic", price: 653089, rankKey: "warrior", currentRank: "warrior", targetRank: "mythic" },
    { id: "warrior3-mythic", title: "Warrior III - Mythic", price: 660089, rankKey: "warrior", currentRank: "warrior", targetRank: "mythic" },
  ]},
  { id: "paket-elite", title: "Paket Elite", packages: [
    { id: "elite3-master4", title: "Elite III - Master IV", price: 45089, rankKey: "elite", currentRank: "elite", targetRank: "master" },
    { id: "elite3-gm5", title: "Elite III - GM V", price: 123089, rankKey: "elite", currentRank: "elite", targetRank: "grandmaster" },
    { id: "elite3-epic5", title: "Elite III - Epic V", price: 259089, rankKey: "elite", currentRank: "elite", targetRank: "epic" },
    { id: "elite3-legend5", title: "Elite III - Legend V", price: 435089, rankKey: "elite", currentRank: "elite", targetRank: "legend" },
    { id: "elite1-mythic", title: "Elite I - Mythic", price: 605089, rankKey: "elite", currentRank: "elite", targetRank: "mythic" },
    { id: "elite2-mythic", title: "Elite II - Mythic", price: 620089, rankKey: "elite", currentRank: "elite", targetRank: "mythic" },
    { id: "elite3-mythic", title: "Elite III - Mythic", price: 635089, rankKey: "elite", currentRank: "elite", targetRank: "mythic" },
  ]},
  { id: "paket-master", title: "Paket Master", packages: [
    { id: "master4-gm5", title: "Master IV - GM V", price: 78089, rankKey: "master", currentRank: "master", targetRank: "grandmaster" },
    { id: "master4-epic5", title: "Master IV - Epic V", price: 213089, rankKey: "master", currentRank: "master", targetRank: "epic" },
    { id: "master4-legend5", title: "Master IV - Legend V", price: 389089, rankKey: "master", currentRank: "master", targetRank: "legend" },
    { id: "master1-mythic", title: "Master I - Mythic", price: 533089, rankKey: "master", currentRank: "master", targetRank: "mythic" },
    { id: "master2-mythic", title: "Master II - Mythic", price: 550089, rankKey: "master", currentRank: "master", targetRank: "mythic" },
    { id: "master3-mythic", title: "Master III - Mythic", price: 570089, rankKey: "master", currentRank: "master", targetRank: "mythic" },
    { id: "master4-mythic", title: "Master IV - Mythic", price: 590089, rankKey: "master", currentRank: "master", targetRank: "mythic" },
  ]},
  { id: "paket-gm", title: "Paket Grand Master", packages: [
    { id: "gm5-epic5", title: "GM V - Epic V", price: 113089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "epic" },
    { id: "gm5-legend5", title: "GM V - Legend V", price: 259089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "legend" },
    { id: "gm1-mythic", title: "GM I - Mythic", price: 338089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic" },
    { id: "gm2-mythic", title: "GM II - Mythic", price: 360089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic" },
    { id: "gm3-mythic", title: "GM III - Mythic", price: 383089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic" },
    { id: "gm4-mythic", title: "GM IV - Mythic", price: 405089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic" },
    { id: "gm5-mythic", title: "GM V - Mythic", price: 428089, rankKey: "grandmaster", currentRank: "grandmaster", targetRank: "mythic" },
    { id: "gm1-honor", title: "GM I - Mythic Honor", price: 511089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor" },
    { id: "gm2-honor", title: "GM II - Mythic Honor", price: 533089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor" },
    { id: "gm3-honor", title: "GM III - Mythic Honor", price: 556089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor" },
    { id: "gm4-honor", title: "GM IV - Mythic Honor", price: 578089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor" },
    { id: "gm5-honor", title: "GM V - Mythic Honor", price: 601089, rankKey: "mythichonor", currentRank: "grandmaster", targetRank: "mythichonor" },
    { id: "gm1-glory", title: "GM I - Mythic Glory", price: 983089, rankKey: "mythicglory", currentRank: "grandmaster", targetRank: "mythicglory" },
    { id: "gm2-glory", title: "GM II - Mythic Glory", price: 1006089, rankKey: "mythicglory", currentRank: "grandmaster", targetRank: "mythicglory" },
    { id: "gm3-glory", title: "GM III - Mythic Glory", price: 1028089, rankKey: "mythicglory", currentRank: "grandmaster", targetRank: "mythicglory" },
    { id: "gm4-glory", title: "GM IV - Mythic Glory", price: 1051089, rankKey: "mythicglory", currentRank: "grandmaster", targetRank: "mythicglory" },
    { id: "gm5-glory", title: "GM V - Mythic Glory", price: 1073089, rankKey: "mythicglory", currentRank: "grandmaster", targetRank: "mythicglory" },
    { id: "gm1-immortal", title: "GM I - Mythic Immortal", price: 2153089, rankKey: "mythicimmortal", currentRank: "grandmaster", targetRank: "mythicimmortal" },
    { id: "gm2-immortal", title: "GM II - Mythic Immortal", price: 2176089, rankKey: "mythicimmortal", currentRank: "grandmaster", targetRank: "mythicimmortal" },
    { id: "gm3-immortal", title: "GM III - Mythic Immortal", price: 2198089, rankKey: "mythicimmortal", currentRank: "grandmaster", targetRank: "mythicimmortal" },
    { id: "gm4-immortal", title: "GM IV - Mythic Immortal", price: 2221089, rankKey: "mythicimmortal", currentRank: "grandmaster", targetRank: "mythicimmortal" },
    { id: "gm5-immortal", title: "GM V - Mythic Immortal", price: 2243089, rankKey: "mythicimmortal", currentRank: "grandmaster", targetRank: "mythicimmortal" },
  ]},
  { id: "paket-epic", title: "Paket Epic", packages: [
    { id: "epic5-legend5", title: "Epic V - Legend V", price: 146089, rankKey: "epic", currentRank: "epic", targetRank: "legend" },
    { id: "epic1-mythic", title: "Epic I - Mythic", price: 198089, rankKey: "epic", currentRank: "epic", targetRank: "mythic" },
    { id: "epic2-mythic", title: "Epic II - Mythic", price: 227089, rankKey: "epic", currentRank: "epic", targetRank: "mythic" },
    { id: "epic3-mythic", title: "Epic III - Mythic", price: 257089, rankKey: "epic", currentRank: "epic", targetRank: "mythic" },
    { id: "epic4-mythic", title: "Epic IV - Mythic", price: 286089, rankKey: "epic", currentRank: "epic", targetRank: "mythic" },
    { id: "epic5-mythic", title: "Epic V - Mythic", price: 315089, rankKey: "epic", currentRank: "epic", targetRank: "mythic" },
    { id: "epic1-honor", title: "Epic I - Mythic Honor", price: 371089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor" },
    { id: "epic2-honor", title: "Epic II - Mythic Honor", price: 401089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor" },
    { id: "epic3-honor", title: "Epic III - Mythic Honor", price: 430089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor" },
    { id: "epic4-honor", title: "Epic IV - Mythic Honor", price: 459089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor" },
    { id: "epic5-honor", title: "Epic V - Mythic Honor", price: 488089, rankKey: "mythichonor", currentRank: "epic", targetRank: "mythichonor" },
    { id: "epic1-glory", title: "Epic I - Mythic Glory", price: 844089, rankKey: "mythicglory", currentRank: "epic", targetRank: "mythicglory" },
    { id: "epic2-glory", title: "Epic II - Mythic Glory", price: 873089, rankKey: "mythicglory", currentRank: "epic", targetRank: "mythicglory" },
    { id: "epic3-glory", title: "Epic III - Mythic Glory", price: 902089, rankKey: "mythicglory", currentRank: "epic", targetRank: "mythicglory" },
    { id: "epic4-glory", title: "Epic IV - Mythic Glory", price: 932089, rankKey: "mythicglory", currentRank: "epic", targetRank: "mythicglory" },
    { id: "epic5-glory", title: "Epic V - Mythic Glory", price: 961089, rankKey: "mythicglory", currentRank: "epic", targetRank: "mythicglory" },
    { id: "epic1-immortal", title: "Epic I - Mythic Immortal", price: 2014089, rankKey: "mythicimmortal", currentRank: "epic", targetRank: "mythicimmortal" },
    { id: "epic2-immortal", title: "Epic II - Mythic Immortal", price: 2043089, rankKey: "mythicimmortal", currentRank: "epic", targetRank: "mythicimmortal" },
    { id: "epic3-immortal", title: "Epic III - Mythic Immortal", price: 2072089, rankKey: "mythicimmortal", currentRank: "epic", targetRank: "mythicimmortal" },
    { id: "epic4-immortal", title: "Epic IV - Mythic Immortal", price: 2102089, rankKey: "mythicimmortal", currentRank: "epic", targetRank: "mythicimmortal" },
    { id: "epic5-immortal", title: "Epic V - Mythic Immortal", price: 2131089, rankKey: "mythicimmortal", currentRank: "epic", targetRank: "mythicimmortal" },
  ]},
  { id: "paket-legend", title: "Paket Legend", packages: [
    { id: "legend1-mythic", title: "Legend I - Mythic", price: 34089, rankKey: "legend", currentRank: "legend", targetRank: "mythic" },
    { id: "legend2-mythic", title: "Legend II - Mythic", price: 68089, rankKey: "legend", currentRank: "legend", targetRank: "mythic" },
    { id: "legend3-mythic", title: "Legend III - Mythic", price: 101089, rankKey: "legend", currentRank: "legend", targetRank: "mythic" },
    { id: "legend4-mythic", title: "Legend IV - Mythic", price: 135089, rankKey: "legend", currentRank: "legend", targetRank: "mythic" },
    { id: "legend5-mythic", title: "Legend V - Mythic", price: 169089, rankKey: "legend", currentRank: "legend", targetRank: "mythic" },
    { id: "legend1-honor", title: "Legend I - Mythic Honor", price: 376089, rankKey: "mythichonor", currentRank: "legend", targetRank: "mythichonor" },
    { id: "legend2-honor", title: "Legend II - Mythic Honor", price: 410089, rankKey: "mythichonor", currentRank: "legend", targetRank: "mythichonor" },
    { id: "legend3-honor", title: "Legend III - Mythic Honor", price: 443089, rankKey: "mythichonor", currentRank: "legend", targetRank: "mythichonor" },
    { id: "legend4-honor", title: "Legend IV - Mythic Honor", price: 477089, rankKey: "mythichonor", currentRank: "legend", targetRank: "mythichonor" },
    { id: "legend5-honor", title: "Legend V - Mythic Honor", price: 511089, rankKey: "mythichonor", currentRank: "legend", targetRank: "mythichonor" },
    { id: "legend1-glory", title: "Legend I - Mythic Glory", price: 848089, rankKey: "mythicglory", currentRank: "legend", targetRank: "mythicglory" },
    { id: "legend2-glory", title: "Legend II - Mythic Glory", price: 882089, rankKey: "mythicglory", currentRank: "legend", targetRank: "mythicglory" },
    { id: "legend3-glory", title: "Legend III - Mythic Glory", price: 916089, rankKey: "mythicglory", currentRank: "legend", targetRank: "mythicglory" },
    { id: "legend4-glory", title: "Legend IV - Mythic Glory", price: 950089, rankKey: "mythicglory", currentRank: "legend", targetRank: "mythicglory" },
    { id: "legend5-glory", title: "Legend V - Mythic Glory", price: 983089, rankKey: "mythicglory", currentRank: "legend", targetRank: "mythicglory" },
    { id: "legend1-immortal", title: "Legend I - Mythic Immortal", price: 2018089, rankKey: "mythicimmortal", currentRank: "legend", targetRank: "mythicimmortal" },
    { id: "legend2-immortal", title: "Legend II - Mythic Immortal", price: 2052089, rankKey: "mythicimmortal", currentRank: "legend", targetRank: "mythicimmortal" },
    { id: "legend3-immortal", title: "Legend III - Mythic Immortal", price: 2086089, rankKey: "mythicimmortal", currentRank: "legend", targetRank: "mythicimmortal" },
    { id: "legend4-immortal", title: "Legend IV - Mythic Immortal", price: 2120089, rankKey: "mythicimmortal", currentRank: "legend", targetRank: "mythicimmortal" },
    { id: "legend5-immortal", title: "Legend V - Mythic Immortal", price: 2153089, rankKey: "mythicimmortal", currentRank: "legend", targetRank: "mythicimmortal" },
  ]},
  { id: "paket-mythic", title: "Paket Mythic", packages: [
    { id: "mythic-grading", title: "Open Grading (Auto Star 15)", price: 180089, rankKey: "mythic", currentRank: "mythic", targetRank: "mythic" },
    { id: "mythic-honor", title: "Mythic Grading - Mythic Honor (25)", price: 342089, rankKey: "mythichonor", currentRank: "mythic", targetRank: "mythichonor" },
    { id: "mythic-glory", title: "Mythic Grading - Mythic Glory (50)", price: 815089, rankKey: "mythicglory", currentRank: "mythic", targetRank: "mythicglory" },
    { id: "mythic-immortal", title: "Mythic Grading - Mythic Immortal (100)", price: 1985089, rankKey: "mythicimmortal", currentRank: "mythic", targetRank: "mythicimmortal" },
  ]},
  { id: "paket-honor", title: "Paket Mythic Honor", packages: [
    { id: "honor-glory", title: "Mythic Honor (25) - Mythic Glory (50)", price: 473089, rankKey: "mythicglory", currentRank: "mythichonor", targetRank: "mythicglory" },
    { id: "honor-immortal", title: "Mythic Honor (25) - Mythic Immortal (100)", price: 1643089, rankKey: "mythicimmortal", currentRank: "mythichonor", targetRank: "mythicimmortal" },
  ]},
  { id: "paket-glory", title: "Paket Mythic Glory", packages: [
    { id: "glory-immortal", title: "Mythic Glory (50) - Mythic Immortal (100)", price: 1170089, rankKey: "mythicimmortal", currentRank: "mythicglory", targetRank: "mythicimmortal" },
  ]},
];

async function run() {
  const totalPkgs = catalog.reduce((s, c) => s + c.packages.length, 0);
  console.log(`Inserting pricing_catalog: ${catalog.length} categories, ${totalPkgs} packages`);

  const res = await fetch(U + "/rest/v1/settings", {
    method: "POST",
    headers: H,
    body: JSON.stringify({ key: "pricing_catalog", value: catalog }),
  });

  if (res.status === 201 || res.status === 200) {
    console.log("✅ pricing_catalog inserted successfully!");
  } else {
    const txt = await res.text();
    console.log("Status:", res.status, txt);
    // Try upsert if conflict
    if (res.status === 409) {
      const res2 = await fetch(U + "/rest/v1/settings?key=eq.pricing_catalog", {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({ value: catalog }),
      });
      console.log("PATCH status:", res2.status, res2.status === 204 ? "✅ Updated!" : "❌ Failed");
    }
  }

  // Verify
  const verify = await fetch(U + "/rest/v1/settings?key=eq.pricing_catalog&select=key", { headers: { apikey: K, Authorization: "Bearer " + K } });
  const rows = await verify.json();
  console.log("Verify: rows =", rows.length);
}

run().catch(console.error);
