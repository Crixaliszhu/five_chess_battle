// 棋盘和UI渲染
const BOARD_SIZE = 15

export default class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas
    this.ctx = ctx
    this.resize(canvas.width, canvas.height)
    this.lastPos = null  // 最后落子位置，用于高亮
  }

  resize(width, height) {
    this.W = width
    this.H = height
    // 棋盘区域
    this.boardSize = Math.min(this.W, this.H) * 0.88
    this.padding = this.boardSize * 0.045
    this.cell = (this.boardSize - this.padding * 2) / (BOARD_SIZE - 1)
    this.boardX = (this.W - this.boardSize) / 2
    this.boardY = this.H * 0.16
  }

  // 全量重绘
  draw(board, currentTurn, playerColor, diffLabel, gameOver) {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.W, this.H)
    this._drawBg()
    this._drawHeader(currentTurn, playerColor, diffLabel)
    this._drawBoard()
    this._drawPieces(board)
    this._drawFooter()
  }

  _drawBg() {
    const ctx = this.ctx
    // 背景渐变
    const grad = ctx.createLinearGradient(0, 0, 0, this.H)
    grad.addColorStop(0, '#c8b89a')
    grad.addColorStop(1, '#a89070')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, this.W, this.H)
  }

  _drawHeader(currentTurn, playerColor, diffLabel) {
    const ctx = this.ctx
    const W = this.W
    // 顶部背景
    ctx.fillStyle = '#4a2e10'
    ctx.fillRect(0, 0, W, this.boardY - 10)

    const isPlayerTurn = (currentTurn === playerColor)
    const playerActive = isPlayerTurn
    const aiActive = !isPlayerTurn

    // 玩家头像区
    this._drawPlayerCard(W * 0.12, this.boardY * 0.45, '👤', '玩家', playerActive, playerColor === 1)
    // AI头像区
    this._drawPlayerCard(W * 0.88, this.boardY * 0.45, '🤖', diffLabel, aiActive, playerColor !== 1)

    // 中间棋子指示
    const ballColor = currentTurn === 1 ? '#111' : '#eee'
    ctx.beginPath()
    ctx.arc(W / 2, this.boardY * 0.45, 18, 0, Math.PI * 2)
    ctx.fillStyle = ballColor
    ctx.fill()
    ctx.strokeStyle = '#888'
    ctx.lineWidth = 1
    ctx.stroke()

    // 箭头指向当前方
    ctx.fillStyle = '#f5c842'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (isPlayerTurn) {
      ctx.fillText('▶', W * 0.3, this.boardY * 0.45)
    } else {
      ctx.fillText('◀', W * 0.7, this.boardY * 0.45)
    }
  }

  _drawPlayerCard(cx, cy, emoji, label, active, isBlack) {
    const ctx = this.ctx
    ctx.globalAlpha = active ? 1.0 : 0.45
    // 头像圆框
    ctx.beginPath()
    ctx.arc(cx, cy - 8, 22, 0, Math.PI * 2)
    ctx.fillStyle = '#5a3a1a'
    ctx.fill()
    ctx.strokeStyle = active ? '#f5c842' : '#888'
    ctx.lineWidth = active ? 2.5 : 1
    ctx.stroke()
    ctx.font = '24px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(emoji, cx, cy - 8)
    // 名字
    ctx.fillStyle = '#fff'
    ctx.font = '13px sans-serif'
    ctx.fillText(label, cx, cy + 20)
    ctx.globalAlpha = 1.0
  }

  _drawBoard() {
    const ctx = this.ctx
    const { boardX: bx, boardY: by, boardSize: bs, padding: pad, cell } = this

    // 棋盘木纹
    ctx.fillStyle = '#dcb468'
    this._roundRect(bx, by, bs, bs, 8)
    ctx.fill()

    // 棋盘边框阴影
    ctx.shadowColor = 'rgba(0,0,0,0.4)'
    ctx.shadowBlur = 12
    ctx.strokeStyle = '#8b5e1a'
    ctx.lineWidth = 2
    this._roundRect(bx, by, bs, bs, 8)
    ctx.stroke()
    ctx.shadowBlur = 0

    // 网格线
    ctx.strokeStyle = '#8b5e1a'
    ctx.lineWidth = 0.7
    for (let i = 0; i < BOARD_SIZE; i++) {
      const x = bx + pad + i * cell
      const y = by + pad + i * cell
      ctx.beginPath(); ctx.moveTo(x, by + pad); ctx.lineTo(x, by + pad + (BOARD_SIZE-1)*cell); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(bx + pad, y); ctx.lineTo(bx + pad + (BOARD_SIZE-1)*cell, y); ctx.stroke()
    }

    // 星位
    const stars = [3, 7, 11]
    ctx.fillStyle = '#5c3a1e'
    for (const r of stars)
      for (const c of stars) {
        ctx.beginPath()
        ctx.arc(bx + pad + c * cell, by + pad + r * cell, cell * 0.1, 0, Math.PI * 2)
        ctx.fill()
      }
  }

  _drawPieces(board) {
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        if (board[r][c]) this._drawPiece(r, c, board[r][c])

    // 最后落子高亮
    if (this.lastPos) {
      const { r, c } = this.lastPos
      const x = this.boardX + this.padding + c * this.cell
      const y = this.boardY + this.padding + r * this.cell
      this.ctx.beginPath()
      this.ctx.arc(x, y, this.cell * 0.18, 0, Math.PI * 2)
      this.ctx.fillStyle = 'rgba(255,80,80,0.85)'
      this.ctx.fill()
    }
  }

  _drawPiece(r, c, color) {
    const ctx = this.ctx
    const x = this.boardX + this.padding + c * this.cell
    const y = this.boardY + this.padding + r * this.cell
    const radius = this.cell * 0.44

    const grad = ctx.createRadialGradient(x - radius*0.3, y - radius*0.3, radius*0.05, x, y, radius)
    if (color === 1) {
      grad.addColorStop(0, '#777'); grad.addColorStop(1, '#000')
    } else {
      grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#ccc')
    }
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = color === 1 ? '#222' : '#aaa'
    ctx.lineWidth = 0.5
    ctx.stroke()
  }

  _drawFooter() {
    const ctx = this.ctx
    const W = this.W, H = this.H
    const fy = this.boardY + this.boardSize + 18
    const btns = [
      { icon: '🚪', label: '退出', id: 'exit' },
      { icon: '↩', label: '悔棋', id: 'undo' },
      { icon: '🔄', label: '重玩', id: 'restart' },
      { icon: '⚙', label: '设置', id: 'settings' },
    ]
    const btnW = W / btns.length
    btns.forEach(({ icon, label }, i) => {
      const cx = btnW * i + btnW / 2
      const cy = fy + 28
      ctx.beginPath()
      ctx.arc(cx, cy, 26, 0, Math.PI * 2)
      ctx.fillStyle = '#7a4e2a'
      ctx.fill()
      ctx.strokeStyle = '#d4a843'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.font = '22px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(icon, cx, cy)
      ctx.fillStyle = '#fff'
      ctx.font = '11px sans-serif'
      ctx.fillText(label, cx, cy + 36)
    })
    // 存储按钮区域供点击检测
    this.footerBtns = btns.map(({ id }, i) => ({
      id,
      cx: btnW * i + btnW / 2,
      cy: fy + 28,
      r: 26
    }))
    this.footerY = fy
  }

  // 绘制难度选择弹窗
  drawModal(difficulty, playerFirst) {
    const ctx = this.ctx
    const W = this.W, H = this.H
    // 遮罩
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, W, H)

    const mw = W * 0.82, mh = H * 0.52
    const mx = (W - mw) / 2, my = (H - mh) / 2

    // 弹窗背景
    ctx.fillStyle = '#f5e6c8'
    this._roundRect(mx, my, mw, mh, 16)
    ctx.fill()
    ctx.strokeStyle = '#8b6914'
    ctx.lineWidth = 3
    this._roundRect(mx, my, mw, mh, 16)
    ctx.stroke()

    // 标题
    ctx.fillStyle = '#d4a843'
    this._roundRect(mx + mw*0.2, my + 14, mw*0.6, 36, 18)
    ctx.fill()
    ctx.fillStyle = '#5c2a00'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('难度选择', W / 2, my + 32)

    // 关闭按钮
    ctx.beginPath()
    ctx.arc(mx + mw - 18, my + 18, 14, 0, Math.PI * 2)
    ctx.fillStyle = '#e05a2b'
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText('✕', mx + mw - 18, my + 18)

    // 难度选项
    const opts = [
      { val: 'easy', label: '初出茅庐' },
      { val: 'medium', label: '登堂入室' },
      { val: 'hard', label: '炉火纯青' },
    ]
    const optY0 = my + 68
    opts.forEach(({ val, label }, i) => {
      const oy = optY0 + i * 40
      const active = difficulty === val
      ctx.beginPath()
      ctx.arc(mx + 36, oy, 10, 0, Math.PI * 2)
      ctx.fillStyle = active ? '#44cc44' : '#7a5030'
      ctx.fill()
      ctx.fillStyle = '#3a2000'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, mx + 56, oy)
    })

    // 分隔线
    const divY = optY0 + opts.length * 40 + 8
    ctx.strokeStyle = '#b8860b'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(mx + 20, divY); ctx.lineTo(mx + mw*0.35, divY); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(mx + mw*0.65, divY); ctx.lineTo(mx + mw - 20, divY); ctx.stroke()
    ctx.fillStyle = '#5c3a1e'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('选择先后手', W / 2, divY)

    // 先后手
    const turnY = divY + 30
    const firstX = mx + mw * 0.28, secondX = mx + mw * 0.68
    ;[{ x: firstX, val: true, label: '先手' }, { x: secondX, val: false, label: '后手' }].forEach(({ x, val, label }) => {
      const active = playerFirst === val
      ctx.beginPath()
      ctx.arc(x - 18, turnY, 10, 0, Math.PI * 2)
      ctx.fillStyle = active ? '#44cc44' : '#7a5030'
      ctx.fill()
      ctx.fillStyle = '#3a2000'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, x - 4, turnY)
    })

    // 开始按钮
    const btnY = my + mh - 52
    const btnW2 = mw * 0.6, btnH = 40
    const btnX = mx + (mw - btnW2) / 2
    const grad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH)
    grad.addColorStop(0, '#f5c842'); grad.addColorStop(1, '#d4860a')
    ctx.fillStyle = grad
    this._roundRect(btnX, btnY, btnW2, btnH, 20)
    ctx.fill()
    ctx.strokeStyle = '#a06010'
    ctx.lineWidth = 2
    this._roundRect(btnX, btnY, btnW2, btnH, 20)
    ctx.stroke()
    ctx.fillStyle = '#5c2a00'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('开始游戏', W / 2, btnY + btnH / 2)

    // 存储弹窗点击区域
    this.modalRects = {
      close: { x: mx + mw - 32, y: my + 4, w: 28, h: 28 },
      opts: opts.map(({ val }, i) => ({ val, x: mx + 16, y: optY0 + i * 40 - 16, w: mw - 32, h: 32 })),
      first: { x: mx + mw*0.1, y: turnY - 16, w: mw*0.35, h: 32 },
      second: { x: mx + mw*0.5, y: turnY - 16, w: mw*0.35, h: 32 },
      start: { x: btnX, y: btnY, w: btnW2, h: btnH },
    }
    this.modalMx = mx; this.modalMy = my; this.modalMw = mw; this.modalMh = mh
  }

  // 绘制结果弹窗
  drawResult(text) {
    const ctx = this.ctx
    const W = this.W, H = this.H
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, W, H)

    const mw = W * 0.7, mh = 180
    const mx = (W - mw) / 2, my = (H - mh) / 2

    ctx.fillStyle = '#f5e6c8'
    this._roundRect(mx, my, mw, mh, 16)
    ctx.fill()
    ctx.strokeStyle = '#8b6914'
    ctx.lineWidth = 3
    this._roundRect(mx, my, mw, mh, 16)
    ctx.stroke()

    ctx.fillStyle = '#5c2a00'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, W / 2, my + 60)

    const btnY = my + 110, btnW2 = mw * 0.6, btnH = 40
    const btnX = mx + (mw - btnW2) / 2
    const grad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH)
    grad.addColorStop(0, '#f5c842'); grad.addColorStop(1, '#d4860a')
    ctx.fillStyle = grad
    this._roundRect(btnX, btnY, btnW2, btnH, 20)
    ctx.fill()
    ctx.fillStyle = '#5c2a00'
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText('再来一局', W / 2, btnY + btnH / 2)

    this.resultBtn = { x: btnX, y: btnY, w: btnW2, h: btnH }
  }

  _roundRect(x, y, w, h, r) {
    const ctx = this.ctx
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.arcTo(x + w, y, x + w, y + r, r)
    ctx.lineTo(x + w, y + h - r)
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
    ctx.lineTo(x + r, y + h)
    ctx.arcTo(x, y + h, x, y + h - r, r)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
  }

  drawMainMenu() {
    const ctx = this.ctx
    const W = this.W, H = this.H
    ctx.clearRect(0, 0, W, H)

    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#2c1810')
    grad.addColorStop(1, '#1a0f0a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    ctx.fillStyle = '#d4a843'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('今日小游戏', W / 2, H * 0.08)

    const titleY = H * 0.25
    ctx.fillStyle = '#f5c842'
    ctx.font = 'bold 36px sans-serif'
    ctx.fillText('趣味五子棋', W / 2, titleY)

    const subtitleY = H * 0.33
    ctx.fillStyle = '#c9a453'
    ctx.font = '18px sans-serif'
    ctx.fillText('动脑益智 乐在棋中', W / 2, subtitleY)

    const btnY = H * 0.45
    const btnW = W * 0.7
    const btnH = 50
    const btnX = (W - btnW) / 2
    const grad2 = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH)
    grad2.addColorStop(0, '#4a9c2d')
    grad2.addColorStop(1, '#2d6a1a')
    ctx.fillStyle = grad2
    this._roundRect(btnX, btnY, btnW, btnH, 28)
    ctx.fill()
    ctx.strokeStyle = '#6bc23a'
    ctx.lineWidth = 2
    this._roundRect(btnX, btnY, btnW, btnH, 28)
    ctx.stroke()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 22px sans-serif'
    ctx.fillText('五子棋对战', W / 2, btnY + btnH / 2 + 2)

    this.mainMenuBtn = { x: btnX, y: btnY, w: btnW, h: btnH }

    const btn2Y = btnY + btnH + 18
    const grad3 = ctx.createLinearGradient(btnX, btn2Y, btnX, btn2Y + btnH)
    grad3.addColorStop(0, '#3d83d8')
    grad3.addColorStop(1, '#1d4e9d')
    ctx.fillStyle = grad3
    this._roundRect(btnX, btn2Y, btnW, btnH, 28)
    ctx.fill()
    ctx.strokeStyle = '#79b7ff'
    ctx.lineWidth = 2
    this._roundRect(btnX, btn2Y, btnW, btnH, 28)
    ctx.stroke()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 20px sans-serif'
    ctx.fillText('单机斗地主', W / 2, btn2Y + btnH / 2 + 2)

    this.landlordMenuBtn = { x: btnX, y: btn2Y, w: btnW, h: btnH }

    const btn3Y = btn2Y + btnH + 18
    ctx.fillStyle = '#3a2a1a'
    this._roundRect(btnX, btn3Y, btnW, btnH, 28)
    ctx.fill()
    ctx.strokeStyle = '#5a4a3a'
    ctx.lineWidth = 2
    this._roundRect(btnX, btn3Y, btnW, btnH, 28)
    ctx.stroke()
    ctx.fillStyle = '#a89070'
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText('更多游戏', W / 2, btn3Y + btnH / 2 + 2)

    this.moreGamesBtn = { x: btnX, y: btn3Y, w: btnW, h: btnH }

    const footerY = H * 0.85
    ctx.fillStyle = '#4a3020'
    ctx.fillRect(0, footerY - 15, W, 50)
    ctx.fillStyle = '#8a7a6a'
    ctx.font = '14px sans-serif'
    ctx.fillText('每日挑战 乐在其中', W / 2, footerY + 5)
  }

  drawLandlordStart() {
    const ctx = this.ctx
    const W = this.W, H = this.H
    ctx.clearRect(0, 0, W, H)
    this._drawLandlordBg()
    this._drawLandlordTopBar(true)

    const cardW = Math.min(86, W * 0.08)
    const cardH = cardW * 1.35
    const groupW = cardW * 2 + 24
    const gx = (W - groupW) / 2
    const gy = H * 0.18
    ctx.fillStyle = 'rgba(13,35,88,0.58)'
    this._roundRect(gx - 20, gy - 16, groupW + 40, cardH + 34, 10)
    ctx.fill()
    this._drawFeatureCard(gx, gy, cardW, cardH, 'x2', '积分翻倍')
    this._drawFeatureCard(gx + cardW + 24, gy, cardW, cardH, '♣', '记牌器')

    const btnW = W * 0.18
    const btnH = H * 0.12
    const btnX = (W - btnW) / 2
    const btnY = H * 0.55
    const grad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH)
    grad.addColorStop(0, '#67d487')
    grad.addColorStop(1, '#2a9f58')
    ctx.fillStyle = grad
    this._roundRect(btnX, btnY, btnW, btnH, 8)
    ctx.fill()
    ctx.strokeStyle = '#8af2a6'
    ctx.lineWidth = 2
    this._roundRect(btnX, btnY, btnW, btnH, 8)
    ctx.stroke()
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.max(22, H * 0.06)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('开始游戏', W / 2, btnY + btnH / 2)

    ctx.fillStyle = 'rgba(16,34,76,0.45)'
    ctx.font = `${Math.max(14, H * 0.035)}px sans-serif`
    ctx.fillText('经典玩法', W / 2, btnY + btnH + 48)
    this.landlordStartBtn = { x: btnX, y: btnY, w: btnW, h: btnH }
    this.landlordBackBtn = { x: W * 0.055, y: H * 0.05, w: 64, h: 48 }
  }

  drawLandlordGame(state) {
    const ctx = this.ctx
    const W = this.W, H = this.H
    ctx.clearRect(0, 0, W, H)
    this._drawLandlordBg()
    this.landlordActionBtns = []
    this.landlordHandRects = []

    this._drawLandlordPlayers(state)
    this._drawBottomCards(state.bottomCards, state.phase !== 'call')

    if (state.phase === 'call') this._drawCalling(state)
    if (state.phase === 'play') this._drawPlayHud(state)

    this._drawHand(state.hands[0], state.selected)
    if (state.phase === 'result') this._drawLandlordResult(state)
    this._drawLandlordTopBar(false)
  }

  _drawLandlordBg() {
    const ctx = this.ctx
    const W = this.W, H = this.H
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#213976')
    grad.addColorStop(0.55, '#315da8')
    grad.addColorStop(1, '#172a63')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(255,255,255,0.035)'
    for (let i = -W; i < W * 1.4; i += 28) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + W * 0.45, H)
      ctx.lineWidth = 8
      ctx.strokeStyle = 'rgba(255,255,255,0.025)'
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(12,26,65,0.25)'
    ctx.font = `bold ${Math.max(30, H * 0.1)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('斗地主', W / 2, H * 0.38)
    ctx.font = `${Math.max(18, H * 0.05)}px sans-serif`
    ctx.fillText('经典玩法', W / 2, H * 0.47)
  }

  _drawLandlordTopBar(showBack) {
    const ctx = this.ctx
    const W = this.W, H = this.H
    const x = W * 0.035
    const y = H * 0.045
    const w = Math.max(74, W * 0.08)
    const h = Math.max(34, H * 0.075)
    ctx.fillStyle = 'rgba(12,29,70,0.58)'
    this._roundRect(x, y, w, h, 18)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.32)'
    ctx.lineWidth = 1
    this._roundRect(x, y, w, h, 18)
    ctx.stroke()
    ctx.fillStyle = '#f4d85a'
    ctx.font = `bold ${Math.max(18, H * 0.04)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(showBack ? '返回' : '退出', x + w / 2, y + h / 2)
    this.landlordExitBtn = { x, y, w, h }
  }

  _drawFeatureCard(x, y, w, h, mark, label) {
    const ctx = this.ctx
    ctx.fillStyle = '#fff6dd'
    this._roundRect(x, y, w, h, 8)
    ctx.fill()
    ctx.fillStyle = '#56a988'
    this._roundRect(x + w * 0.18, y + h * 0.1, w * 0.64, w * 0.64, 8)
    ctx.fill()
    ctx.fillStyle = mark === 'x2' ? '#ffd33d' : '#ffffff'
    ctx.font = `bold ${w * 0.34}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(mark, x + w / 2, y + h * 0.35)
    ctx.fillStyle = '#5c3a1e'
    ctx.font = `bold ${w * 0.18}px sans-serif`
    ctx.fillText(label, x + w / 2, y + h * 0.72)
    ctx.fillStyle = '#278ec8'
    this._roundRect(x + w * 0.13, y + h * 0.79, w * 0.74, h * 0.14, 16)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${w * 0.16}px sans-serif`
    ctx.fillText('免费使用', x + w / 2, y + h * 0.86)
  }

  _drawLandlordPlayers(state) {
    const ctx = this.ctx
    const W = this.W, H = this.H
    const left = { x: W * 0.075, y: H * 0.29, name: 'AI左', id: 1 }
    const right = { x: W * 0.925, y: H * 0.29, name: 'AI右', id: 2 }
    ;[left, right].forEach(p => {
      const active = state.currentPlayer === p.id && state.phase === 'play'
      ctx.globalAlpha = active ? 1 : 0.9
      ctx.beginPath()
      ctx.arc(p.x, p.y, H * 0.075, 0, Math.PI * 2)
      ctx.fillStyle = p.id === state.landlord ? '#bd6a28' : '#f1d7b4'
      ctx.fill()
      ctx.strokeStyle = active ? '#f5d454' : 'rgba(255,255,255,0.6)'
      ctx.lineWidth = active ? 4 : 2
      ctx.stroke()
      ctx.fillStyle = '#4b250d'
      ctx.font = `bold ${H * 0.048}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(p.id === state.landlord ? '地' : '农', p.x, p.y)
      ctx.globalAlpha = 1

      const countX = p.id === 1 ? p.x + H * 0.09 : p.x - H * 0.12
      this._drawCardBack(countX, p.y + H * 0.01, H * 0.048, H * 0.07)
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${H * 0.035}px sans-serif`
      ctx.fillText(String(state.hands[p.id].length), countX, p.y + H * 0.012)
      if (p.id === state.landlord) this._drawLandlordBadge(p.x, p.y + H * 0.12)
    })

    if (state.landlord === 0) this._drawLandlordBadge(W * 0.08, H * 0.92)
    if (state.landlord !== null && state.landlord !== undefined) {
      ctx.fillStyle = '#ffe27b'
      ctx.font = `bold ${H * 0.045}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(`地主：${state.landlord === 0 ? '玩家' : state.landlord === 1 ? 'AI左' : 'AI右'}`, W / 2, H * 0.18)
    }

    if (state.lastPlay && state.lastPlay.cards.length) {
      const p = state.lastPlay.player
      let x = W / 2 - 60, y = H * 0.34
      if (p === 1) { x = W * 0.16; y = H * 0.28 }
      if (p === 2) { x = W * 0.76; y = H * 0.28 }
      this._drawMiniCards(state.lastPlay.cards, x, y)
    }
  }

  _drawCalling(state) {
    const ctx = this.ctx
    const W = this.W, H = this.H
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${H * 0.075}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const turnName = state.callTurn === 0 ? '你' : state.callTurn === 1 ? 'AI左' : 'AI右'
    ctx.fillText(`${turnName}叫分`, W / 2, H * 0.31)

    if (state.callText[1]) ctx.fillText(state.callText[1], W * 0.22, H * 0.31)
    if (state.callText[2]) ctx.fillText(state.callText[2], W * 0.78, H * 0.31)

    if (state.callTurn !== 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.82)'
      ctx.font = `bold ${H * 0.04}px sans-serif`
      ctx.fillText('AI 思考中...', W / 2, H * 0.48)
      return
    }

    const labels = ['不叫', '1分', '2分', '3分']
    const bw = W * 0.14, bh = H * 0.1
    const gap = W * 0.045
    const sx = (W - bw * labels.length - gap * (labels.length - 1)) / 2
    labels.forEach((label, i) => {
      const x = sx + i * (bw + gap)
      const y = H * 0.47
      const grad = ctx.createLinearGradient(x, y, x, y + bh)
      grad.addColorStop(0, i === 0 ? '#8fa4f0' : '#ffd474')
      grad.addColorStop(1, i === 0 ? '#596fd1' : '#e99a2a')
      ctx.fillStyle = grad
      this._roundRect(x, y, bw, bh, 6)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${H * 0.055}px sans-serif`
      ctx.fillText(label, x + bw / 2, y + bh / 2)
      this.landlordActionBtns.push({ id: `bid-${i}`, x, y, w: bw, h: bh })
    })
  }

  _drawPlayHud(state) {
    const ctx = this.ctx
    const W = this.W, H = this.H
    const isPlayerTurn = state.currentPlayer === 0
    ctx.fillStyle = isPlayerTurn ? '#fff' : 'rgba(255,255,255,0.78)'
    ctx.font = `bold ${H * 0.045}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(isPlayerTurn ? '请选择手牌出牌' : 'AI 出牌中...', W / 2, H * 0.5)
    if (!isPlayerTurn) return

    const labels = [
      { id: 'pass', text: '不出', color: '#6377d8' },
      { id: 'hint', text: '提示', color: '#3aaed8' },
      { id: 'play', text: '出牌', color: '#f0a738' },
    ]
    const bw = W * 0.1, bh = H * 0.08, gap = W * 0.025
    const sx = (W - bw * labels.length - gap * 2) / 2
    labels.forEach((btn, i) => {
      const x = sx + i * (bw + gap)
      const y = H * 0.62
      ctx.fillStyle = btn.color
      this._roundRect(x, y, bw, bh, 6)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${H * 0.04}px sans-serif`
      ctx.fillText(btn.text, x + bw / 2, y + bh / 2)
      this.landlordActionBtns.push({ id: btn.id, x, y, w: bw, h: bh })
    })
  }

  _drawLandlordResult(state) {
    const ctx = this.ctx
    const W = this.W, H = this.H
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, W, H)
    const mw = W * 0.32, mh = H * 0.38
    const mx = (W - mw) / 2, my = (H - mh) / 2
    ctx.fillStyle = '#fff5d6'
    this._roundRect(mx, my, mw, mh, 12)
    ctx.fill()
    ctx.strokeStyle = '#f4bf45'
    ctx.lineWidth = 3
    this._roundRect(mx, my, mw, mh, 12)
    ctx.stroke()
    ctx.fillStyle = state.resultWin ? '#d6412f' : '#3551b8'
    ctx.font = `bold ${H * 0.08}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(state.resultWin ? '成功' : '失败', W / 2, my + mh * 0.35)
    ctx.fillStyle = '#2f2b22'
    ctx.font = `bold ${H * 0.04}px sans-serif`
    ctx.fillText('再来一局', W / 2, my + mh * 0.72)
    this.landlordActionBtns.push({ id: 'again', x: mx + mw * 0.23, y: my + mh * 0.58, w: mw * 0.54, h: mh * 0.25 })
  }

  _drawBottomCards(cards, revealed) {
    const W = this.W, H = this.H
    const cw = H * 0.075, ch = cw * 1.35
    const sx = W / 2 - cw * 1.65
    cards.forEach((card, i) => {
      const x = sx + i * cw * 1.1
      const y = H * 0.03
      if (revealed) this._drawCard(card, x, y, cw, ch)
      else this._drawCardBack(x, y, cw, ch)
    })
  }

  _drawHand(hand, selected) {
    const W = this.W, H = this.H
    const cw = Math.min(H * 0.17, W / 13)
    const ch = cw * 1.35
    const overlap = Math.min(cw * 0.58, (W * 0.86 - cw) / Math.max(1, hand.length - 1))
    const totalW = cw + overlap * (hand.length - 1)
    const sx = (W - totalW) / 2
    const yBase = H - ch - H * 0.055
    hand.forEach((card, i) => {
      const selectedUp = selected.includes(i)
      const x = sx + i * overlap
      const y = yBase - (selectedUp ? H * 0.035 : 0)
      this._drawCard(card, x, y, cw, ch)
      this.landlordHandRects.push({ index: i, x, y: yBase - H * 0.05, w: cw, h: ch + H * 0.06 })
    })
  }

  _drawMiniCards(cards, x, y) {
    const cw = this.H * 0.07, ch = cw * 1.35
    cards.forEach((card, i) => this._drawCard(card, x + i * cw * 0.55, y, cw, ch))
  }

  _drawCard(card, x, y, w, h) {
    const ctx = this.ctx
    ctx.fillStyle = '#f7f7f2'
    this._roundRect(x, y, w, h, 5)
    ctx.fill()
    ctx.strokeStyle = '#d4d4d4'
    ctx.lineWidth = 1
    this._roundRect(x, y, w, h, 5)
    ctx.stroke()
    const color = card.red ? '#bd251f' : '#171717'
    ctx.fillStyle = color
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.font = `bold ${w * 0.34}px serif`
    const rank = card.label || card.rank
    ctx.fillText(rank, x + w * 0.12, y + h * 0.08)
    ctx.font = `${w * 0.34}px serif`
    ctx.fillText(card.joker ? '★' : card.suit, x + w * 0.13, y + h * 0.34)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.font = `${w * 0.42}px serif`
    ctx.fillText(card.joker ? '★' : card.suit, x + w * 0.88, y + h * 0.9)
  }

  _drawCardBack(x, y, w, h) {
    const ctx = this.ctx
    ctx.fillStyle = '#f1f5f7'
    this._roundRect(x, y, w, h, 5)
    ctx.fill()
    ctx.fillStyle = '#4b91b8'
    this._roundRect(x + 4, y + 4, w - 8, h - 8, 4)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'
    ctx.lineWidth = 1
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.moveTo(x + 8 + i * w * 0.16, y + 7)
      ctx.lineTo(x + w - 8, y + h - 8 - i * h * 0.12)
      ctx.stroke()
    }
  }

  _drawLandlordBadge(cx, cy) {
    const ctx = this.ctx
    ctx.fillStyle = '#172b62'
    this._roundRect(cx - 36, cy - 14, 72, 28, 14)
    ctx.fill()
    ctx.fillStyle = '#ffd968'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('地主', cx, cy)
  }

  // 将屏幕坐标转换为棋盘格子坐标
  screenToBoard(x, y) {
    const c = Math.round((x - this.boardX - this.padding) / this.cell)
    const r = Math.round((y - this.boardY - this.padding) / this.cell)
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return null
    // 容差：点击位置距交叉点不超过半格
    const px = this.boardX + this.padding + c * this.cell
    const py = this.boardY + this.padding + r * this.cell
    const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2)
    if (dist > this.cell * 0.5) return null
    return { r, c }
  }

  hitTest(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
  }

  hitCircle(x, y, cx, cy, r) {
    return Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) <= r
  }
}
