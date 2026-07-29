"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type CardBrief = { id: string; localId: string; name: string; image?: string };
type SetBrief = { id: string; name: string };
type SetDetail = SetBrief & { cards?: CardBrief[] };
type Market = {
  low?: number;
  trend?: number;
  avg?: number;
  avg1?: number;
  avg7?: number;
  avg30?: number;
  "low-holo"?: number;
  "trend-holo"?: number;
  "avg-holo"?: number;
  "avg1-holo"?: number;
  "avg7-holo"?: number;
  "avg30-holo"?: number;
  updated?: string;
};
type DetailedVariant = {
  type: "normal" | "holo" | "reverse" | string;
  foil?: string;
  stamp?: string[];
  variantId: string;
  pricing?: { cardmarket?: Market };
};
type Card = CardBrief & {
  rarity?: string;
  set?: { id?: string; name?: string };
  variants?: { normal?: boolean; reverse?: boolean; holo?: boolean };
  variants_detailed?: DetailedVariant[];
  pricing?: { cardmarket?: Market };
};
type Offer = Card & {
  price: number;
  priceNumber: number;
  finish: string;
  offerKey: string;
  priceLabel: string;
  availableFinishes: string;
  grading?: string;
  searchCondition?: string;
  variantKey: string;
};
type ListItem = Offer & {
  rowId: string;
  language: string;
  condition: string;
};

const API = "https://api.tcgdex.net/v2/en";
const SET_CODE_CORRECTIONS: Record<string, string> = {
  PRS: "PRE",
};
const KNOWN_SPECIAL_VARIANTS: Record<string, DetailedVariant[]> = {
  "swsh1-65": [
    {
      type: "holo",
      stamp: ["play-pokemon"],
      variantId: "play-pokemon-stamp",
    },
  ],
};
const money = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
});

function imageUrl(image?: string) {
  return image ? `${image}/high.webp` : "";
}

function variantLabel(variant: DetailedVariant) {
  const foil = variant.foil?.toLowerCase();
  if (variant.stamp?.includes("pokemon-together"))
    return "Pokémon Together stamp";
  if (variant.stamp?.includes("snowflake")) return "Snowflake stamp";
  if (
    variant.stamp?.some((stamp) =>
      /play[\s!-]*pokemon/i.test(stamp.replace(/-/g, " ")),
    )
  )
    return "Play! Pokémon stamp";
  if (foil === "pokeball") return "Poké Ball";
  if (foil === "greatball") return "Great Ball";
  if (foil === "masterball") return "Master Ball";
  if (foil === "cracked-ice") return "Cracked Ice Holo";
  if (foil === "cosmos" || foil === "cosmos-holo") return "Cosmos Holo";
  if (foil === "galaxy" || foil === "galaxy-holo") return "Galaxy Holo";
  if (variant.type === "reverse") return "Reverse Holo";
  if (variant.type === "holo") return "Holo";
  return "Basic / Normaal";
}

function cardVariants(card: Card): DetailedVariant[] {
  const variants: DetailedVariant[] = card.variants_detailed
    ? [...card.variants_detailed]
    : [];
  if (!variants.length) {
  if (card.variants?.normal)
    variants.push({ type: "normal", variantId: `${card.id}-normal` });
  if (card.variants?.holo)
    variants.push({ type: "holo", variantId: `${card.id}-holo` });
  if (card.variants?.reverse)
    variants.push({ type: "reverse", variantId: `${card.id}-reverse` });
  }
  for (const special of KNOWN_SPECIAL_VARIANTS[card.id] ?? []) {
    if (!variants.some((variant) => variant.variantId === special.variantId))
      variants.push(special);
  }
  return variants;
}

function cleanCardNumber(value: string) {
  const withoutTotal = value.split("/")[0];
  const match = withoutTotal.match(/^0*(\d+)(.*)$/i);
  return match ? `${match[1] || "0"}${match[2]}` : value;
}

function cleanPokemonName(value: string) {
  return value
    .replace(/\b(?:lv|level)\.?\s*(?:x|\d+)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCombinedSearch(value: string) {
  const trimmed = value.trim();
  const spaced = trimmed.match(
    /^(.*?)\s+([a-z0-9][a-z0-9.-]{1,9})\s+[#/]?(\d{1,4}[a-z]?(?:\/\d{1,4})?)$/i,
  );
  const compact = trimmed.match(
    /^(.*?)\s+([a-z][a-z0-9.-]{1,8})[#-]?0*(\d{1,4}[a-z]?)$/i,
  );
  const match = spaced || compact;
  if (!match) return null;
  return {
    name: cleanPokemonName(match[1]),
    set: match[2],
    number: match[3],
  };
}

function gradedMultiplier(grader: string, grade: number) {
  const byGrade: Record<number, number> = {
    10: 5.5,
    9: 2.3,
    8: 1.55,
    7: 1.2,
    6: 1,
    5: 0.9,
    4: 0.78,
    3: 0.67,
    2: 0.58,
    1: 0.5,
  };
  const graderFactor: Record<string, number> = {
    PSA: 1,
    CGC: 0.82,
    "Beckett / BGS": 0.95,
    "C&C": 0.62,
    ACE: 0.68,
    TAG: 0.72,
    SGC: 0.75,
    Anders: 0.58,
  };
  return (byGrade[grade] ?? 1) * (graderFactor[grader] ?? 0.58);
}

function conditionMultiplier(condition: string) {
  const factors: Record<string, number> = {
    "Near Mint": 1,
    Excellent: 0.82,
    Good: 0.68,
    "Light Played": 0.52,
    Played: 0.35,
    Poor: 0.2,
  };
  return factors[condition] ?? 1;
}

async function loadCardDetails(briefs: CardBrief[], limit = 80) {
  return (
    await Promise.all(
      briefs.slice(0, limit).map(async (brief) => {
        try {
          const response = await fetch(`${API}/cards/${brief.id}`);
          return response.ok ? ((await response.json()) as Card) : null;
        } catch {
          return null;
        }
      }),
    )
  ).filter(Boolean) as Card[];
}

async function findCardsByNameAndSet(value: string) {
  const words = value.trim().split(/\s+/);
  if (words.length < 2) return null;

  const firstSplit = Math.max(1, words.length - 4);
  for (let split = words.length - 1; split >= firstSplit; split -= 1) {
    const cardName = cleanPokemonName(words.slice(0, split).join(" "));
    const setSearch = words.slice(split).join(" ");
    if (cardName.length < 2 || setSearch.length < 1) continue;

    const setQueries = [
      fetch(`${API}/sets?${new URLSearchParams({ name: setSearch }).toString()}`),
      fetch(
        `${API}/sets?${new URLSearchParams({
          "abbreviation.official": `eq:${setSearch.toUpperCase()}`,
        }).toString()}`,
      ),
    ];
    const setResponses = await Promise.all(setQueries);
    const setGroups = await Promise.all(
      setResponses.map(async (response) =>
        response.ok ? ((await response.json()) as SetBrief[]) : [],
      ),
    );
    const sets = Array.from(
      new Map(setGroups.flat().map((set) => [set.id, set])).values(),
    );
    if (!sets.length) continue;

    const setDetails = (
      await Promise.all(
        sets.map(async (set) => {
          const response = await fetch(`${API}/sets/${encodeURIComponent(set.id)}`);
          return response.ok ? ((await response.json()) as SetDetail) : null;
        }),
      )
    ).filter(Boolean) as SetDetail[];
    const normalizedName = cardName.toLowerCase();
    const briefs = setDetails.flatMap((set) =>
      (set.cards ?? []).filter((card) =>
        card.name.toLowerCase().includes(normalizedName),
      ),
    );
    const matches = await loadCardDetails(briefs);
    if (matches.length) return { cardName, setSearch, cards: matches };
  }
  return null;
}

function selectedVariants(card: Card, requested: string) {
  const variants = cardVariants(card);
  if (requested !== "Automatisch")
    return variants.filter((variant) => variantLabel(variant) === requested);
  const standard =
    variants.find(
      (variant) =>
        variant.type === "normal" && !variant.foil && !variant.stamp?.length,
    ) ||
    variants.find(
      (variant) =>
        variant.type === "holo" && !variant.foil && !variant.stamp?.length,
    ) ||
    variants.find(
      (variant) =>
        variant.type === "reverse" && !variant.foil && !variant.stamp?.length,
    ) ||
    variants[0];
  return standard ? [standard] : [];
}

function getPriceOptions(card: Card, variant: DetailedVariant) {
  const market =
    variant.pricing?.cardmarket ?? card.pricing?.cardmarket;
  if (!market) return [];
  const holo = variant.type !== "normal" || Boolean(variant.foil);
  const variantPrice = (special: number | undefined, standard: number | undefined) =>
    holo && typeof special === "number" && special > 0 ? special : standard;
  const options = [
    {
      key: "day",
      priceNumber: 2,
      label: "Marktfeed gemiddelde vandaag",
      value: variantPrice(market["avg1-holo"], market.avg1),
    },
    {
      key: "month",
      priceNumber: 4,
      label: "Marktfeed gemiddelde 30 dagen",
      value: variantPrice(market["avg30-holo"], market.avg30),
    },
  ];

  return options.filter(
    (option): option is {
      key: string;
      priceNumber: number;
      label: string;
      value: number;
    } =>
      typeof option.value === "number",
  );
}

export default function Home() {
  const [name, setPokemonName] = useState("");
  const [setFilter, setSetFilter] = useState("");
  const [number, setNumber] = useState("");
  const [finish, setFinish] = useState("Automatisch");
  const [language, setLanguage] = useState("Engels");
  const [condition, setCondition] = useState("Near Mint");
  const [graded, setGraded] = useState("Niet graded");
  const [grader, setGrader] = useState("PSA");
  const [grade, setGrade] = useState("10");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [visibleOffers, setVisibleOffers] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);
  const [list, setList] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("zamexcards-value-list");
    if (saved) {
      try {
        setList(JSON.parse(saved));
      } catch {
        localStorage.removeItem("zamexcards-value-list");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("zamexcards-value-list", JSON.stringify(list));
  }, [list]);

  const total = useMemo(
    () => list.reduce((sum, item) => sum + item.price, 0),
    [list],
  );
  const offerGroups = useMemo(() => {
    const groups = new Map<string, Offer[]>();
    for (const offer of offers) {
      const key = `${offer.id}-${offer.variantKey}`;
      const group = groups.get(key) ?? [];
      group.push(offer);
      groups.set(key, group);
    }
    return Array.from(groups, ([key, groupOffers]) => ({
      key,
      offers: groupOffers.sort((a, b) => a.price - b.price),
    }));
  }, [offers]);

  async function searchCards(event: FormEvent) {
    event.preventDefault();
    const combined = !setFilter.trim() && !number.trim()
      ? parseCombinedSearch(name)
      : null;
    const cleanName = cleanPokemonName(combined?.name ?? name);
    const rawSet = (combined?.set ?? setFilter).trim();
    const rawNumber = (combined?.number ?? number).trim();
    const spacedCode = rawNumber
      ? null
      : rawSet.match(/^([a-z0-9.-]{2,8})\s+([a-z]*\d+[a-z0-9-]*)$/i);
    const compactCode =
      rawNumber || spacedCode
        ? null
        : rawSet.match(/^([a-z]{2,8})(\d{3,4})$/i);
    const parsedCode = spacedCode || compactCode;
    const cleanSet = parsedCode ? parsedCode[1] : rawSet;
    const cleanNumber = rawNumber || parsedCode?.[2] || "";
    const normalizedCardNumber = cleanCardNumber(cleanNumber);
    const enteredSetCode = cleanSet.toUpperCase();
    const normalizedSetCode =
      SET_CODE_CORRECTIONS[enteredSetCode] || enteredSetCode;
    const looksLikeSetCode = /^[A-Z0-9.-]{2,10}$/.test(enteredSetCode);
    const hasName = cleanName.length >= 2;
    const hasSetAndNumber = cleanSet.length > 0 && cleanNumber.length > 0;

    if (!hasName && !hasSetAndNumber) {
      setMessage(
        cleanName.length === 1
          ? "Vul minimaal twee letters van de Pokémonnaam in, of zoek met set én kaartnummer."
          : "Vul een Pokémonnaam in, of vul zowel de set als het kaartnummer in.",
      );
      return;
    }

    setLoading(true);
    setMessage("");
    setOffers([]);
    setVisibleOffers(5);
    setSelected([]);

    try {
      let details: Card[] = [];

      if (hasSetAndNumber) {
        if (looksLikeSetCode) {
          const codeResponse = await fetch(
            `${API}/sets?${new URLSearchParams({
              "abbreviation.official": `eq:${normalizedSetCode}`,
            }).toString()}`,
          );
          if (codeResponse.ok) {
            const codeSets = (await codeResponse.json()) as SetBrief[];
            details = (
              await Promise.all(
                codeSets.slice(0, 10).map(async (set) => {
                  try {
                    const response = await fetch(
                      `${API}/sets/${encodeURIComponent(set.id)}/${encodeURIComponent(normalizedCardNumber)}`,
                    );
                    return response.ok
                      ? ((await response.json()) as Card)
                      : null;
                  } catch {
                    return null;
                  }
                }),
              )
            ).filter(Boolean) as Card[];
          }

          if (!details.length) {
            const promoNumber = `${normalizedSetCode}${cleanNumber}`;
            const promoResponse = await fetch(
              `${API}/cards?${new URLSearchParams({ localId: `eq:${promoNumber}` }).toString()}`,
            );
            if (promoResponse.ok) {
              const promoCards = (await promoResponse.json()) as CardBrief[];
              details = (
                await Promise.all(
                  promoCards.slice(0, 10).map(async (card) => {
                    try {
                      const response = await fetch(`${API}/cards/${card.id}`);
                      return response.ok
                        ? ((await response.json()) as Card)
                        : null;
                    } catch {
                      return null;
                    }
                  }),
                )
              ).filter(Boolean) as Card[];
            }
          }
        }

        if (!details.length) {
          const setResponse = await fetch(
            `${API}/sets?${new URLSearchParams({ name: cleanSet }).toString()}`,
          );
          if (!setResponse.ok) throw new Error("set-search");
          const sets = (await setResponse.json()) as SetBrief[];
          details = (
            await Promise.all(
              sets.slice(0, 20).map(async (set) => {
                try {
                  const cardResponse = await fetch(
                    `${API}/sets/${encodeURIComponent(set.id)}/${encodeURIComponent(normalizedCardNumber)}`,
                  );
                  return cardResponse.ok
                    ? ((await cardResponse.json()) as Card)
                    : null;
                } catch {
                  return null;
                }
              }),
            )
          ).filter(Boolean) as Card[];
        }
      } else {
        const combinedNameSet =
          !cleanNumber
            ? await findCardsByNameAndSet(
                cleanSet ? `${cleanName} ${cleanSet}` : cleanName,
              )
            : null;
        if (combinedNameSet) {
          const numberedSearch = cleanName.match(
            /^(.*?)\s+0*(\d{1,4}[a-z]?)$/i,
          );
          let numberedCards: Card[] = [];
          if (numberedSearch?.[1] && numberedSearch[2]) {
            const numberQuery = new URLSearchParams({
              name: cleanPokemonName(numberedSearch[1]),
              localId: `eq:${cleanCardNumber(numberedSearch[2])}`,
            });
            const numberResponse = await fetch(
              `${API}/cards?${numberQuery.toString()}`,
            );
            if (numberResponse.ok) {
              numberedCards = await loadCardDetails(
                (await numberResponse.json()) as CardBrief[],
              );
            }
          }
          details = Array.from(
            new Map(
              [...combinedNameSet.cards, ...numberedCards].map((card) => [
                card.id,
                card,
              ]),
            ).values(),
          );
        } else {
          const query = new URLSearchParams({ name: cleanName });
          if (cleanNumber) query.set("localId", `eq:${normalizedCardNumber}`);
          const response = await fetch(`${API}/cards?${query.toString()}`);
          if (!response.ok) throw new Error("card-search");
          const briefs = (await response.json()) as CardBrief[];
          details = await loadCardDetails(briefs, 40);
        }
      }

      let requestedSetIds = new Set<string>();
      if (cleanSet && !cleanNumber) {
        const setResponses = await Promise.all([
          fetch(`${API}/sets?${new URLSearchParams({ name: cleanSet }).toString()}`),
          fetch(
            `${API}/sets?${new URLSearchParams({
              "abbreviation.official": `eq:${normalizedSetCode}`,
            }).toString()}`,
          ),
        ]);
        const setGroups = await Promise.all(
          setResponses.map(async (response) =>
            response.ok ? ((await response.json()) as SetBrief[]) : [],
          ),
        );
        requestedSetIds = new Set(setGroups.flat().map((set) => set.id));
      }
      const matchingCards = details.filter((card) => {
        if (!cleanSet || cleanNumber) return true;
        if (card.set?.id && requestedSetIds.has(card.set.id)) return true;
        return card.set?.name
          ?.toLowerCase()
          .includes(cleanSet.toLowerCase());
      });
      const availableFinishes = Array.from(
        new Set(
          matchingCards.flatMap((card) =>
            cardVariants(card).map(variantLabel),
          ),
        ),
      );
      const availableFinishesText =
        availableFinishes.length > 0
          ? availableFinishes.join(", ")
          : "onbekend";
      const candidates = matchingCards
        .flatMap((card) =>
          selectedVariants(card, finish).flatMap((variant) =>
            getPriceOptions(card, variant).map((option) => {
              const isGraded = graded === "Graded";
              const selectedGrade = Number(grade);
              const adjustedPrice = isGraded
                ? option.value * gradedMultiplier(grader, selectedGrade)
                : option.value * conditionMultiplier(condition);
              return {
                ...card,
                price: adjustedPrice,
                priceNumber: option.priceNumber,
                finish: variantLabel(variant),
                offerKey: `${card.id}-${variant.variantId}-${option.key}-${isGraded ? `${grader}-${grade}` : "raw"}`,
                priceLabel: isGraded
                  ? `${grader} ${grade}-indicatie · ${option.label}`
                  : `${condition}-indicatie · ${option.label}`,
                availableFinishes: availableFinishesText,
                grading: isGraded ? `${grader} ${grade}` : undefined,
                searchCondition: isGraded ? undefined : condition,
                variantKey: variant.variantId,
              };
            }),
          ),
        )
        .sort((a, b) => a.price - b.price);
      const found = candidates;
      const foundCardGroups = new Set(
        found.map((offer) => `${offer.id}-${offer.variantKey}`),
      ).size;

      setOffers(found);
      setMessage(
        found.length
          ? graded === "Graded"
            ? `${foundCardGroups} kaartuitvoering(en) gevonden met graded waarde-indicaties voor ${grader} ${grade}. Beschikbare uitvoering(en): ${availableFinishesText}.`
            : `${foundCardGroups} kaartuitvoering(en) gevonden voor ${language}, conditie ${condition}. Per kaart staan de prijzen naast elkaar. De onderliggende marktfeed is niet op taal of conditie gefilterd.`
          : finish !== "Automatisch" && availableFinishes.length
            ? `Deze kaart bestaat niet als ${finish}. Beschikbaar: ${availableFinishesText}.`
            : "Geen actuele prijsgegevens gevonden. Probeer zonder set of kaartnummer.",
      );
    } catch {
      setMessage(
        "De actuele prijsgegevens konden niet worden geladen. Probeer het later opnieuw.",
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleOffer(offerKey: string) {
    setSelected((current) =>
      current.includes(offerKey)
        ? current.filter((item) => item !== offerKey)
        : [...current, offerKey],
    );
  }

  function addSelected() {
    const chosen = offers.filter((offer) =>
      selected.includes(offer.offerKey),
    );
    if (!chosen.length) {
      setMessage("Vink eerst minimaal één kaart aan.");
      return;
    }
    setList((current) => [
      ...current,
      ...chosen.map((offer) => ({
        ...offer,
        rowId: `${offer.offerKey}-${Date.now()}-${Math.random()}`,
        language,
        condition,
      })),
    ]);
    setSelected([]);
    setMessage(`${chosen.length} kaart(en) toegevoegd aan je lijst.`);
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#" aria-label="ZamexCards kaartwaarde">
          <span className="brandMark">Z</span>
          <span>
            <strong>ZamexCards</strong>
            <small>KAARTWAARDE</small>
          </span>
        </a>
        <div className="livePill">
          <span />
          Actuele marktdata
        </div>
      </header>

      <section className="hero">
        <div className="heroCopy">
          <p className="eyebrow">SLIMMER VERZAMELEN &amp; VERKOPEN</p>
          <h1>
            Wat is mijn <span>Pokémonkaart</span> waard?
          </h1>
          <p className="intro">
            Zoek je kaart, vergelijk actuele marktindicatoren en maak
            eenvoudig je eigen waardelijst.
          </p>
          <div className="trustRow">
            <span>✓ Taal en conditie duidelijk vermeld</span>
            <span>✓ Prijzen van laag naar hoog</span>
            <span>✓ Lijst blijft bewaard</span>
          </div>
        </div>

        <form className="searchCard" onSubmit={searchCards}>
          <div className="formHeading">
            <span className="step">1</span>
            <div>
              <h2>Vind jouw kaart</h2>
              <p>Zoek op naam, set + nummer of direct op een setcode.</p>
            </div>
          </div>

          <label>
            Welke Pokémon staat erop?
            <input
              value={name}
              onChange={(e) => setPokemonName(e.target.value)}
              placeholder="Bijv. Charizard of Charizard Lv.60 AR 1"
              autoComplete="off"
            />
          </label>

          <div className="twoCols">
            <label>
              Set
              <input
                value={setFilter}
                onChange={(e) => setSetFilter(e.target.value)}
                placeholder="Bijv. 151, POR of POR 005"
              />
            </label>
            <label>
              Kaartnummer
              <input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Bijv. 199"
              />
            </label>
          </div>

          <div className="twoCols">
            <label>
              Uitvoering
              <select value={finish} onChange={(e) => setFinish(e.target.value)}>
                <option>Automatisch</option>
                <option>Basic / Normaal</option>
                <option>Holo</option>
                <option>Reverse Holo</option>
                <option>Poké Ball</option>
                <option>Great Ball</option>
                <option>Master Ball</option>
                <option>Cracked Ice Holo</option>
                <option>Cosmos Holo</option>
                <option>Galaxy Holo</option>
                <option>Pokémon Together stamp</option>
                <option>Snowflake stamp</option>
                <option>Play! Pokémon stamp</option>
              </select>
            </label>
            <label>
              Taal
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option>Engels</option>
                <option>Nederlands</option>
                <option>Japans</option>
                <option>Duits</option>
                <option>Frans</option>
                <option>Italiaans</option>
                <option>Spaans</option>
              </select>
            </label>
          </div>

          <div className="twoCols">
            <label>
              Conditie
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option>Near Mint</option>
                <option>Excellent</option>
                <option>Good</option>
                <option>Light Played</option>
                <option>Played</option>
                <option>Poor</option>
              </select>
            </label>
            <label>
              Kaartstatus
              <select value={graded} onChange={(e) => setGraded(e.target.value)}>
                <option>Niet graded</option>
                <option>Graded</option>
              </select>
            </label>
          </div>

          {graded === "Graded" && (
            <div className="twoCols gradedFields">
              <label>
                Gradingbedrijf
                <select value={grader} onChange={(e) => setGrader(e.target.value)}>
                  <option>PSA</option>
                  <option>CGC</option>
                  <option>Beckett / BGS</option>
                  <option>C&amp;C</option>
                  <option>ACE</option>
                  <option>TAG</option>
                  <option>SGC</option>
                  <option>Anders</option>
                </select>
              </label>
              <label>
                Grade
                <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((score) => (
                    <option key={score}>{score}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <button className="primaryButton" disabled={loading}>
            {loading ? "Prijzen ophalen…" : "Zoek mijn kaart"}
            {!loading && <span>→</span>}
          </button>
        </form>
      </section>

      <section className="content">
        {(message || offers.length > 0) && (
          <div className="resultsSection" aria-live="polite">
            <div className="sectionTitle">
              <div>
                <p className="eyebrow">ACTUELE MARKTGEGEVENS</p>
                <h2>
                  {graded === "Graded"
                    ? "Graded waarde-indicaties van laag naar hoog"
                    : "Marktindicatoren van laag naar hoog"}
                </h2>
              </div>
              <p>{message}</p>
            </div>

            {offers.length > 0 && (
              <>
                <div className="offerGroups">
                  {offerGroups
                    .slice(0, visibleOffers)
                    .map(({ key, offers: groupOffers }) => {
                      const card = groupOffers[0];
                      return (
                        <section className="cardResultGroup" key={key}>
                          <div className="cardResultHeading">
                            <strong>{card.name}</strong>
                            <span>
                              {card.set?.name ?? "Onbekende set"} · #
                              {card.localId} · {card.finish}
                            </span>
                          </div>
                          <div className="offerGrid">
                            {groupOffers.map((offer) => (
                              <label
                                className={`offerCard ${
                                  selected.includes(offer.offerKey)
                                    ? "selected"
                                    : ""
                                }`}
                                key={offer.offerKey}
                              >
                                <input
                                  type="checkbox"
                                  checked={selected.includes(offer.offerKey)}
                                  onChange={() =>
                                    toggleOffer(offer.offerKey)
                                  }
                                />
                                <img
                                  src={imageUrl(offer.image)}
                                  alt={`${offer.name} ${offer.localId}`}
                                />
                                <div className="offerInfo">
                                  <span className="rank">
                                    Prijs {offer.priceNumber}
                                  </span>
                                  <h3>{offer.name}</h3>
                                  <p>
                                    {offer.set?.name ?? "Onbekende set"} · #
                                    {offer.localId}
                                  </p>
                                  <small>
                                    {offer.rarity ?? "Rarity onbekend"} ·{" "}
                                    {offer.finish}
                                    {offer.grading
                                      ? ` · ${offer.grading}`
                                      : ""}
                                    {offer.searchCondition
                                      ? ` · ${offer.searchCondition}`
                                      : ""}
                                  </small>
                                  <strong>{money.format(offer.price)}</strong>
                                  <em>{offer.priceLabel}</em>
                                </div>
                              </label>
                            ))}
                          </div>
                        </section>
                      );
                    })}
                </div>
                {visibleOffers < offerGroups.length && (
                  <button
                    className="moreButton"
                    onClick={() =>
                      setVisibleOffers((current) =>
                        Math.min(current + 5, offerGroups.length),
                      )
                    }
                  >
                    Meer kaarten tonen (
                    {offerGroups.length - visibleOffers} resterend)
                  </button>
                )}
                <button className="addButton" onClick={addSelected}>
                  + Aangevinkte kaart(en) toevoegen
                </button>
              </>
            )}
          </div>
        )}

        <div className="listSection">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">JOUW SELECTIE</p>
              <h2>Kaartenlijst</h2>
            </div>
            <span className="count">{list.length} kaarten</span>
          </div>

          {list.length === 0 ? (
            <div className="emptyState">
              <span>☆</span>
              <h3>Nog geen kaarten toegevoegd</h3>
              <p>Zoek hierboven een kaart en vink een prijs aan.</p>
            </div>
          ) : (
            <div className="listWrap">
              {list.map((item) => (
                <article className="listRow" key={item.rowId}>
                  <img
                    src={imageUrl(item.image)}
                    alt={`${item.name} ${item.localId}`}
                  />
                  <div className="listInfo">
                    <h3>{item.name}</h3>
                    <p>
                      {item.set?.name} · #{item.localId}
                    </p>
                    <small>
                      {item.finish} · {item.language} · {item.condition} ·{" "}
                      {item.grading ? `${item.grading} · ` : ""}
                      {item.priceLabel || "Marktfeed-indicatie"}
                    </small>
                  </div>
                  <strong>{money.format(item.price)}</strong>
                  <button
                    className="deleteButton"
                    onClick={() =>
                      setList((current) =>
                        current.filter((row) => row.rowId !== item.rowId),
                      )
                    }
                    aria-label={`Verwijder ${item.name}`}
                  >
                    ×
                  </button>
                </article>
              ))}
              <div className="totals">
                <div>
                  <span>Totaal geselecteerde prijzen</span>
                  <strong>{money.format(total)}</strong>
                </div>
                <div className="buyTotal">
                  <span>80% ZamexCards inkoopindicatie</span>
                  <strong>{money.format(total * 0.8)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="disclaimer">
          Prijzen zijn indicatief en afkomstig uit een beschikbare Europese
          marktfeed. De feed is niet live gefilterd op taal, conditie,
          verkopersland of verzending. De bedragen zijn marktindicatoren van
          dezelfde kaart en geen individuele verkopersprijzen. Conditiebedragen
          worden automatisch van de ongefilterde marktprijs afgeleid. Graded
          bedragen zijn eveneens waarde-indicaties en geen bevestigde recente
          verkopen. Controleer Cardmarket voor actuele, gefilterde aanbiedingen.
        </p>
      </section>
    </main>
  );
}
