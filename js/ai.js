// AI 五子棋逻辑 —— 优化版
const BOARD_SIZE = 15
const DIRS = [[0,1],[1,0],[1,1],[1,-1]]

// ========== 胜负判断 ==========
function countDir(board, r, c, dr, dc, color) {
  let n = 0
  for (let i = 1; i < 5; i++) {
    const nr = r + dr * i, nc = c + dc * i
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break
    if (board[nr][nc] === color) n++
    else break
  }
  return n
}

function checkWin(board, r, c, color) {
  for (const [dr, dc] of DIRS) {
    const cnt = 1 + countDir(board, r, c, dr, dc, color)
                  + countDir(board, r, c, -dr, -dc, color)
    if (cnt >= 5) return true
  }
  return false
}

function findWinMove(board, color) {
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++)
      if (board[r][c] === 0) {
        board[r][c] = color
        const win = checkWin(board, r, c, color)
        board[r][c] = 0
        if (win) return { r, c }
      }
  return null
}

// ========== 单点评分（只看该点周围，不遍历全盘）==========
// 评估某个位置对某种颜色的价值
function scorePoint(board, r, c, color) {
  let score = 0
  for (const [dr, dc] of DIRS) {
    // 正反两方向合并计数
    let count = 1, block = 0, empty = 0

    for (let sign = -1; sign <= 1; sign += 2) {
      for (let i = 1; i <= 4; i++) {
        const nr = r + dr * i * sign, nc = c + dc * i * sign
        if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) { block++; break }
        const v = board[nr][nc]
        if (v === color) count++
        else if (v === 0) { empty++; break }
        else { block++; break }
      }
    }

    if (count >= 5) { score += 100000; continue }
    // 活N：两端都空；冲N：一端被堵
    if (block === 0) {
      score += [0, 10, 100, 1000, 10000][count] * 2
    } else if (block === 1) {
      score += [0, 1, 10, 100, 1000][count]
    }
  }
  return score
}

// ========== 候选点：限制数量 + 按威胁度排序 ==========
function getCandidates(board, aiColor, playerColor, limit) {
  const scored = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== 0) continue
      // 必须在已有棋子的2格范围内
      if (!hasNeighbor(board, r, c)) continue

      // 综合评分：进攻 + 防守
      const atk = scorePoint(board, r, c, aiColor)
      const def = scorePoint(board, r, c, playerColor)
      scored.push({ r, c, score: Math.max(atk, def * 1.1) })
    }
  }
  if (scored.length === 0) return [{ r: 7, c: 7 }]
  // 按分数降序，只取前 limit 个
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}

function hasNeighbor(board, r, c) {
  for (let dr = -2; dr <= 2; dr++)
    for (let dc = -2; dc <= 2; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] !== 0)
        return true
    }
  return false
}

// ========== 局面评分（增量：只算有棋子的点）==========
function evaluateBoard(board, aiColor, playerColor) {
  let score = 0
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++) {
      const v = board[r][c]
      if (v === aiColor) score += scorePoint(board, r, c, aiColor)
      else if (v === playerColor) score -= scorePoint(board, r, c, playerColor) * 1.1
    }
  return score
}

// ========== Minimax + Alpha-Beta ==========
// limit: 每层候选点数量上限
function minimax(board, depth, alpha, beta, isMax, aiColor, playerColor, limit) {
  if (depth === 0) return evaluateBoard(board, aiColor, playerColor)

  const color = isMax ? aiColor : playerColor
  const moves = getCandidates(board, aiColor, playerColor, limit)

  if (isMax) {
    let best = -Infinity
    for (const { r, c } of moves) {
      board[r][c] = aiColor
      if (checkWin(board, r, c, aiColor)) { board[r][c] = 0; return 100000 + depth }
      const score = minimax(board, depth - 1, alpha, beta, false, aiColor, playerColor, limit)
      board[r][c] = 0
      if (score > best) best = score
      if (best > alpha) alpha = best
      if (beta <= alpha) break
    }
    return best
  } else {
    let best = Infinity
    for (const { r, c } of moves) {
      board[r][c] = playerColor
      if (checkWin(board, r, c, playerColor)) { board[r][c] = 0; return -100000 - depth }
      const score = minimax(board, depth - 1, alpha, beta, true, aiColor, playerColor, limit)
      board[r][c] = 0
      if (score < best) best = score
      if (best < beta) beta = best
      if (beta <= alpha) break
    }
    return best
  }
}

// ========== 对外接口 ==========
function getAIMove(board, aiColor, playerColor, difficulty) {
  // 必胜
  const win = findWinMove(board, aiColor)
  if (win) return win
  // 必防
  const block = findWinMove(board, playerColor)
  if (block) return block

  if (difficulty === 'easy') {
    // 简单：随机 + 浅层评分
    const candidates = getCandidates(board, aiColor, playerColor, 20)
    // 取前5里随机一个，制造失误感
    const pool = candidates.slice(0, Math.min(5, candidates.length))
    return pool[Math.floor(Math.random() * pool.length)]
  }

  if (difficulty === 'medium') {
    // 中等：深度3，每层最多10个候选
    let best = -Infinity, bestPos = null
    const moves = getCandidates(board, aiColor, playerColor, 10)
    for (const { r, c } of moves) {
      board[r][c] = aiColor
      const score = minimax(board, 2, -Infinity, Infinity, false, aiColor, playerColor, 8)
      board[r][c] = 0
      if (score > best) { best = score; bestPos = { r, c } }
    }
    return bestPos || moves[0]
  }

  // 困难：深度4，每层最多8个候选（8^4 = 4096节点，快且强）
  let best = -Infinity, bestPos = null
  const moves = getCandidates(board, aiColor, playerColor, 8)
  for (const { r, c } of moves) {
    board[r][c] = aiColor
    const score = minimax(board, 3, -Infinity, Infinity, false, aiColor, playerColor, 6)
    board[r][c] = 0
    if (score > best) { best = score; bestPos = { r, c } }
  }
  return bestPos || moves[0]
}

export { getAIMove, checkWin, BOARD_SIZE }
