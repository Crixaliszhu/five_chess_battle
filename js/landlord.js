const SUITS = ['♠', '♥', '♣', '♦']
const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']
const RANK_VALUE = {
  '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  J: 11, Q: 12, K: 13, A: 14, '2': 16, SJ: 18, BJ: 20
}

function createDeck() {
  const deck = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: RANK_VALUE[rank], red: suit === '♥' || suit === '♦' })
    }
  }
  deck.push({ suit: '', rank: 'SJ', label: '小王', value: RANK_VALUE.SJ, joker: true, red: false })
  deck.push({ suit: '', rank: 'BJ', label: '大王', value: RANK_VALUE.BJ, joker: true, red: true })
  return deck
}

function shuffle(cards) {
  const list = cards.slice()
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

function sortHand(hand) {
  hand.sort((a, b) => b.value - a.value || a.suit.localeCompare(b.suit))
}

function dealCards() {
  const deck = shuffle(createDeck())
  const hands = [deck.slice(0, 17), deck.slice(17, 34), deck.slice(34, 51)]
  hands.forEach(sortHand)
  return { hands, bottomCards: deck.slice(51) }
}

function estimateBid(hand) {
  const power = hand.reduce((sum, card) => sum + (card.value >= 16 ? 3 : card.value >= 13 ? 1 : 0), 0)
  if (power >= 12) return 3
  if (power >= 8) return 2
  if (power >= 5) return 1
  return Math.random() < 0.35 ? 1 : 0
}

function takeCards(hand, indexes) {
  const picked = indexes
    .slice()
    .sort((a, b) => b - a)
    .map(index => hand.splice(index, 1)[0])
    .filter(Boolean)
  picked.reverse()
  sortHand(hand)
  return picked
}

function takeAiCards(hand) {
  const count = hand.length > 8 && Math.random() < 0.35 ? 2 : 1
  const start = Math.max(0, hand.length - count)
  const indexes = []
  for (let i = start; i < hand.length; i++) indexes.push(i)
  return takeCards(hand, indexes)
}

export { dealCards, estimateBid, sortHand, takeCards, takeAiCards }
