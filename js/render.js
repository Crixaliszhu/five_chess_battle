// 棋盘和UI渲染
const BOARD_SIZE = 15

export default class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas
    this.ctx = ctx
    this.W = canvas.width
    this.H = canvas.height
    // 棋盘区域
    this.boardSize = Math.min(this.W, this.H) * 0.88
    this.padding = this.boardSize * 0.045
    this.cell = (this.boardSize - this.padding * 2) / (BOARD_SIZE - 1)
    this.boardX = (this.W - this.boardSize) / 2
    this.boardY = this.H * 0.16
    this.lastPos = null  // 最后落子位置，用于高亮
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
