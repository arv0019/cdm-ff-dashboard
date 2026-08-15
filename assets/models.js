/* =========================================================================
   WIN PROBABILITY MODEL (v1) — our own estimate, not ESPN's internal number
   =========================================================================
   Approach:
   - Each starter has `pts` (points already accrued this week) and, if not
     yet final, `proj` (expected ADDITIONAL points for the rest of their game).
   - Final players contribute their locked points with zero variance.
   - Not-final players' remaining output is modeled as Normal(proj, sd),
     where sd = proj * POSITION_VARIANCE[pos]. These ratios are estimates,
     not sourced from ESPN — swap in better numbers once you have real
     week-over-week accuracy to check against.
   - Players are assumed independent (no same-game stacking correlation —
     a simplification, not a claim of accuracy).
   - Team total ~ Normal(sum of means, sum of variances). Win probability is
     P(TeamA_total - TeamB_total > 0), computed via the normal CDF.
   ========================================================================= */

const POSITION_VARIANCE = {
  QB: 0.28, RB: 0.35, WR: 0.40, TE: 0.42, FLEX: 0.38, 'D/ST': 0.55, K: 0.45
};

function erf(x){
  const sign = x < 0 ? -1 : 1; x = Math.abs(x);
  const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
  const t = 1/(1+p*x);
  const y = 1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return sign*y;
}
function normalCDF(z){ return 0.5*(1+erf(z/Math.SQRT2)); }

function teamStats(starters){
  let currentScore = 0, mean = 0, variance = 0;
  starters.forEach(p => {
    currentScore += p.pts;
    if (p.final){
      mean += p.pts;
    } else {
      mean += p.pts + p.proj;
      const sd = p.proj * (POSITION_VARIANCE[p.pos] || 0.4);
      variance += sd * sd;
    }
  });
  return { currentScore, mean, variance };
}

function winProbability(teamA, teamB){
  const a = teamStats(teamA), b = teamStats(teamB);
  const meanDiff = a.mean - b.mean;
  const sd = Math.sqrt(a.variance + b.variance) || 0.0001;
  const z = meanDiff / sd;
  return { pA: normalCDF(z), a, b };
}

/* =========================================================================
   TRAVEL MARKET SELECTOR — DFW / Houston / OKC broadcast lookup
   =========================================================================
   Same 506sports.com weekly map used for the DFW tag (see .net-tag comment
   above) shows every market on one page — pulling Houston and OKC alongside
   DFW during the same weekly refresh is effectively free, not a separate fetch.

   Affiliate call signs to search for on that week's page:
     DFW:  CBS=KTVT   FOX=KDFW   NBC=KXAS      ABC=WFAA
     HOU:  CBS=KHOU   FOX=KRIV   NBC=KPRC      ABC=KTRK
     OKC:  CBS=KWTV   FOX=KOKH   NBC=KFOR      ABC=KOCO

   WACO — single Nielsen DMA (#87, "Waco-Temple-Bryan"), NOT two markets.
   It's geographically sprawling enough that most networks run it through a
   pair of sister/satellite stations covering the two halves — same network
   feed, same game assignment either way, just a different channel number
   depending which side of the market you're actually in. One dropdown
   entry, one lookup — no split logic needed.
     WACO: CBS=KWTX (+KBTX satellite, Bryan/College Station side)
           FOX=KWKT (+KYLE sister station, Bryan/College Station side)
           NBC=KCEN (+KAGS-LD satellite, Bryan/College Station side)
           ABC=KXXV (single station, covers the whole DMA)

   Home-team shortcut: DFW (Cowboys) and Houston (Texans) both get their
   team automatically in the early window — no lookup needed those weeks.
   OKC and Waco have no NFL team, so they ALWAYS need the actual weekly map
   check; there's no shortcut to fall back on for either market.

   MARKET_NETWORKS below is keyed by player name -> network tag for that
   market. Players with no entry render as "—" (net-tag.none). Replace with
   real weekly lookups once the season's close enough for 506sports to have
   published that week's map.
   ========================================================================= */

const MARKET_NETWORKS = {
  DFW: { 'Josh Jacobs':'FOX', 'Justin Jefferson':'CBS' },
  HOU: { 'Justin Jefferson':'FOX', 'Jaylen Waddle':'CBS' },
  OKC: { 'Josh Jacobs':'NBC', 'James Cook':'FOX' },
  WACO: { 'Josh Jacobs':'CBS', 'James Cook':'ABC' },
};

// Player-tag lookup + rendering. This only touches [data-player] elements —
// it doesn't know about your page's dropdown IDs. Each page should wrap this
// in its own renderMarket() that also syncs whatever <select> elements it has.
function applyMarketTags(market){
  const nets = MARKET_NETWORKS[market] || {};
  document.querySelectorAll('[data-player]').forEach(el => {
    const name = el.getAttribute('data-player');
    const net = nets[name];
    if (net){
      el.textContent = net;
      el.classList.remove('none');
    } else {
      el.textContent = '—';
      el.classList.add('none');
    }
  });
}
