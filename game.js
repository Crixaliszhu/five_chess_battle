import Renderer from './js/render.js'
import { getAIMove, checkWin, BOARD_SIZE } from './js/ai.js'

// 获取屏幕尺寸（兼容各版本基础库）
const sysInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
const W = sysInfo.windowWidth
const H = sysInfo.windowHeight

// 创建全屏 Canvas
const canvas = wx.createCanvas()
canvas.width = W
canvas.height = H
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

const diffLabels = { easy: '初出茅庐', medium: '登堂入室', hard: '炉火纯青' }

const renderer = new Renderer(canvas, ctx)

// ========== 初始化棋盘 ==========
function initBoard() {
  board = Array.from({ length: BOARD_SIZE }, () => new Array(BOARD_SIZE).fill(0))
  history = []
  gameOver = false
}

// ========== 渲染 ==========
function render() {
  if (showMainMenu) {
    renderer.drawMainMenu()
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
      showMainMenu = false
      showModal = true
      render()
    }
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

// ========== 启动 ==========
initBoard()
render()
