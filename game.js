import Renderer from './js/render.js'
import { getAIMove, checkWin, BOARD_SIZE } from './js/ai.js'
import { dealCards, estimateBid, sortHand, takeCards, takeAiCards } from './js/landlord.js'

// 获取屏幕尺寸（兼容各版本基础库）
function getWindowSize() {
  const sysInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
  return { W: sysInfo.windowWidth, H: sysInfo.windowHeight }
}

const initialSize = getWindowSize()

// 创建全屏 Canvas
const canvas = wx.createCanvas()
canvas.width = initialSize.W
canvas.height = initialSize.H
const ctx = canvas.getContext('2d')

// ========== 游戏状态 ==========
let showMainMenu = true  // 是否显示主界面
let board = []
let history = []
let gameOver = false
let playerColor = 1    // 1=黑 2=白
let aiColor = 2
let currentTurn = 1    // 当前轮到谁落子
let difficulty = 'easy'
let playerFirst = true
let showModal = true
let showResult = false
let resultText = ''
let currentGame = 'menu'
let landlord = null
let landlordTimer = null

const diffLabels = { easy: '初出茅庐', medium: '登堂入室', hard: '炉火纯青' }

const renderer = new Renderer(canvas, ctx)

function resizeCanvas() {
  const { W, H } = getWindowSize()
  canvas.width = W
  canvas.height = H
  renderer.resize(W, H)
}

function setGameOrientation(value) {
  if (wx.setDeviceOrientation) {
    wx.setDeviceOrientation({ value })
  }
  setTimeout(() => {
    resizeCanvas()
    render()
  }, 260)
}

if (wx.onWindowResize) {
  wx.onWindowResize(() => {
    resizeCanvas()
    render()
  })
}

// ========== 初始化棋盘 ==========
function initBoard() {
  board = Array.from({ length: BOARD_SIZE }, () => new Array(BOARD_SIZE).fill(0))
  history = []
  gameOver = false
}

// ========== 渲染 ==========
function render() {
  if (currentGame === 'menu' || showMainMenu) {
    renderer.drawMainMenu()
    return
  }
  if (currentGame === 'landlordStart') {
    renderer.drawLandlordStart()
    return
  }
  if (currentGame === 'landlord') {
    renderer.drawLandlordGame(landlord)
    return
  }
  renderer.draw(board, currentTurn, playerColor, diffLabels[difficulty], gameOver)
  if (showModal) renderer.drawModal(difficulty, playerFirst)
  else if (showResult) renderer.drawResult(resultText)
}

// ========== 落子 ==========
function placeStone(r, c, color) {
  board[r][c] = color
  history.push({ r, c })
  renderer.lastPos = { r, c }
}

function playerMove(r, c) {
  if (gameOver || showModal || showResult) return
  if (currentTurn !== playerColor) return
  if (board[r][c] !== 0) return

  placeStone(r, c, playerColor)
  render()

  if (checkWin(board, r, c, playerColor)) {
    endGame('🎉 你赢了！')
    return
  }
  if (isFull()) { endGame('平局！'); return }

  currentTurn = aiColor
  render()
  setTimeout(doAIMove, 350)
}

function doAIMove() {
  if (gameOver) return
  const pos = getAIMove(board, aiColor, playerColor, difficulty)
  if (!pos) return
  placeStone(pos.r, pos.c, aiColor)
  currentTurn = playerColor
  render()

  if (checkWin(board, pos.r, pos.c, aiColor)) {
    endGame('😢 AI赢了！')
    return
  }
  if (isFull()) { endGame('平局！'); return }
}

function isFull() {
  return board.every(row => row.every(v => v !== 0))
}

function endGame(text) {
  gameOver = true
  resultText = text
  showResult = true
  render()
}

// ========== 悔棋 ==========
function undo() {
  if (gameOver || history.length < 2) return
  for (let i = 0; i < 2; i++) {
    const last = history.pop()
    if (last) board[last.r][last.c] = 0
  }
  renderer.lastPos = history.length > 0 ? history[history.length - 1] : null
  currentTurn = playerColor
  render()
}

// ========== 开始游戏 ==========
function startGame() {
  currentGame = 'gomoku'
  playerColor = playerFirst ? 1 : 2
  aiColor = playerFirst ? 2 : 1
  currentTurn = 1  // 黑棋先走
  initBoard()
  showModal = false
  showResult = false
  renderer.lastPos = null
  render()
  // AI先手
  if (!playerFirst) {
    setTimeout(doAIMove, 400)
  }
}

// ========== 触摸事件（微信小游戏用 wx.onTouchStart，不能用 canvas.addEventListener）==========
wx.onTouchStart((e) => {
  const touch = e.touches[0]
  const x = touch.clientX, y = touch.clientY

  // 主界面交互
  if (showMainMenu) {
    if (renderer.mainMenuBtn && renderer.hitTest(x, y, renderer.mainMenuBtn)) {
      currentGame = 'gomoku'
      setGameOrientation('portrait')
      showMainMenu = false
      showModal = true
      render()
    }
    if (renderer.landlordMenuBtn && renderer.hitTest(x, y, renderer.landlordMenuBtn)) {
      enterLandlordStart()
    }
    return
  }

  if (currentGame === 'landlordStart' || currentGame === 'landlord') {
    handleLandlordTouch(x, y)
    return
  }

  // 弹窗交互
  if (showModal) {
    handleModalTouch(x, y)
    return
  }
  if (showResult) {
    const rb = renderer.resultBtn
    if (rb && renderer.hitTest(x, y, rb)) {
      showResult = false
      showModal = true
      render()
    }
    return
  }

  // 底部按钮
  if (renderer.footerBtns) {
    for (const btn of renderer.footerBtns) {
      if (renderer.hitCircle(x, y, btn.cx, btn.cy, btn.r + 8)) {
        handleFooterBtn(btn.id)
        return
      }
    }
  }

  // 棋盘落子
  const pos = renderer.screenToBoard(x, y)
  if (pos) playerMove(pos.r, pos.c)
})

function handleModalTouch(x, y) {
  const mr = renderer.modalRects
  if (!mr) return

  // 关闭
  if (renderer.hitTest(x, y, mr.close)) {
    if (!gameOver) { showModal = false; render() }
    return
  }
  // 难度选项
  for (const opt of mr.opts) {
    if (renderer.hitTest(x, y, opt)) {
      difficulty = opt.val
      render()
      renderer.drawModal(difficulty, playerFirst)
      return
    }
  }
  // 先手
  if (renderer.hitTest(x, y, mr.first)) {
    playerFirst = true
    render()
    renderer.drawModal(difficulty, playerFirst)
    return
  }
  // 后手
  if (renderer.hitTest(x, y, mr.second)) {
    playerFirst = false
    render()
    renderer.drawModal(difficulty, playerFirst)
    return
  }
  // 开始
  if (renderer.hitTest(x, y, mr.start)) {
    startGame()
    return
  }
}

function handleFooterBtn(id) {
  switch (id) {
    case 'exit':
      currentGame = 'menu'
      showMainMenu = true
      showModal = false
      showResult = false
      render()
      break
    case 'undo':
      undo()
      break
    case 'restart':
      showModal = true
      showResult = false
      render()
      break
    case 'settings':
      showModal = true
      render()
      break
  }
}

// ========== 斗地主 ==========
function clearLandlordTimer() {
  if (landlordTimer) {
    clearTimeout(landlordTimer)
    landlordTimer = null
  }
}

function enterLandlordStart() {
  currentGame = 'landlordStart'
  showMainMenu = false
  showModal = false
  showResult = false
  landlord = null
  clearLandlordTimer()
  setGameOrientation('landscape')
  render()
}

function exitLandlordToMenu() {
  clearLandlordTimer()
  landlord = null
  currentGame = 'menu'
  showMainMenu = true
  showModal = false
  showResult = false
  setGameOrientation('portrait')
  render()
}

function startLandlordRound() {
  clearLandlordTimer()
  const dealt = dealCards()
  landlord = {
    phase: 'call',
    hands: dealt.hands,
    bottomCards: dealt.bottomCards,
    selected: [],
    landlord: null,
    currentBid: 0,
    highestBidder: null,
    callTurn: 0,
    callsMade: 0,
    callText: ['', '', ''],
    currentPlayer: null,
    lastPlay: null,
    resultWin: false,
  }
  currentGame = 'landlord'
  render()
}

function handleLandlordTouch(x, y) {
  if (renderer.landlordExitBtn && renderer.hitTest(x, y, renderer.landlordExitBtn)) {
    exitLandlordToMenu()
    return
  }
  if (currentGame === 'landlordStart') {
    if (renderer.landlordStartBtn && renderer.hitTest(x, y, renderer.landlordStartBtn)) {
      startLandlordRound()
    }
    return
  }

  if (!landlord) return
  if (landlord.phase === 'result') {
    const btn = findLandlordButton(x, y)
    if (btn && btn.id === 'again') startLandlordRound()
    return
  }
  if (landlord.phase === 'call') {
    const btn = findLandlordButton(x, y)
    if (btn && btn.id.startsWith('bid-') && landlord.callTurn === 0) {
      playerBid(Number(btn.id.slice(4)))
    }
    return
  }
  if (landlord.phase !== 'play' || landlord.currentPlayer !== 0) return

  for (let i = renderer.landlordHandRects.length - 1; i >= 0; i--) {
    const rect = renderer.landlordHandRects[i]
    if (renderer.hitTest(x, y, rect)) {
      toggleSelectedCard(rect.index)
      return
    }
  }
  const btn = findLandlordButton(x, y)
  if (!btn) return
  if (btn.id === 'hint') selectHintCard()
  if (btn.id === 'pass') playerPass()
  if (btn.id === 'play') playerPlaySelected()
}

function findLandlordButton(x, y) {
  if (!renderer.landlordActionBtns) return null
  return renderer.landlordActionBtns.find(btn => renderer.hitTest(x, y, btn))
}

function playerBid(score) {
  if (!landlord || landlord.phase !== 'call' || landlord.callTurn !== 0) return
  applyBid(0, score)
}

function applyBid(player, score) {
  landlord.callText[player] = score > 0 ? `${score}分` : '不叫'
  if (score > landlord.currentBid) {
    landlord.currentBid = score
    landlord.highestBidder = player
  }
  landlord.callsMade++
  render()

  if (score === 3) {
    landlordTimer = setTimeout(() => becomeLandlord(player), 450)
    return
  }
  if (landlord.callsMade >= 3) {
    landlordTimer = setTimeout(() => {
      if (landlord.highestBidder === null) startLandlordRound()
      else becomeLandlord(landlord.highestBidder)
    }, 650)
    return
  }
  landlord.callTurn = (landlord.callTurn + 1) % 3
  render()
  if (landlord.callTurn !== 0) scheduleAiBid()
}

function scheduleAiBid() {
  clearLandlordTimer()
  landlordTimer = setTimeout(() => {
    if (!landlord || landlord.phase !== 'call' || landlord.callTurn === 0) return
    const raw = estimateBid(landlord.hands[landlord.callTurn])
    const bid = raw > landlord.currentBid ? raw : 0
    applyBid(landlord.callTurn, bid)
  }, 700)
}

function becomeLandlord(player) {
  if (!landlord) return
  landlord.landlord = player
  landlord.hands[player].push(...landlord.bottomCards)
  sortHand(landlord.hands[player])
  landlord.phase = 'play'
  landlord.currentPlayer = player
  landlord.selected = []
  landlord.lastPlay = null
  render()
  if (player !== 0) scheduleAiPlay()
}

function toggleSelectedCard(index) {
  const selected = landlord.selected
  const pos = selected.indexOf(index)
  if (pos >= 0) selected.splice(pos, 1)
  else selected.push(index)
  render()
}

function selectHintCard() {
  if (!landlord || landlord.hands[0].length === 0) return
  landlord.selected = [landlord.hands[0].length - 1]
  render()
}

function playerPass() {
  if (!landlord || landlord.currentPlayer !== 0) return
  landlord.selected = []
  landlord.lastPlay = { player: 0, cards: [] }
  nextLandlordTurn()
}

function playerPlaySelected() {
  if (!landlord || landlord.currentPlayer !== 0) return
  if (landlord.selected.length === 0) {
    selectHintCard()
    return
  }
  const cards = takeCards(landlord.hands[0], landlord.selected)
  landlord.selected = []
  landlord.lastPlay = { player: 0, cards }
  if (landlord.hands[0].length === 0) {
    finishLandlordRound(true)
    return
  }
  nextLandlordTurn()
}

function nextLandlordTurn() {
  landlord.currentPlayer = (landlord.currentPlayer + 1) % 3
  render()
  if (landlord.currentPlayer !== 0) scheduleAiPlay()
}

function scheduleAiPlay() {
  clearLandlordTimer()
  landlordTimer = setTimeout(() => {
    if (!landlord || landlord.phase !== 'play' || landlord.currentPlayer === 0) return
    const player = landlord.currentPlayer
    const cards = takeAiCards(landlord.hands[player])
    landlord.lastPlay = { player, cards }
    if (landlord.hands[player].length === 0) {
      finishLandlordRound(false)
      return
    }
    nextLandlordTurn()
  }, 850)
}

function finishLandlordRound(playerWon) {
  landlord.phase = 'result'
  landlord.resultWin = playerWon
  landlord.selected = []
  clearLandlordTimer()
  render()
}

// ========== 启动 ==========
initBoard()
render()
