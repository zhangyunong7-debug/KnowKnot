/**
 * 基于规则的题目切分器
 *
 * 针对已知格式：题号 1. 2. 3. 按序排列，每题均为选择题（A. B. C. D. 选项）
 * 兼容 OCR 识别无空格的情况（如 "3.2023年" → "3. 2023年"）
 */

export interface ParsedQuestion {
  order: number
  type: '选择题'
  text: string
  options: string[]
}

/**
 * 检测并转换 OCR 文本中的表格为 markdown 表格格式
 *
 * 模式 1：连续的月份行（2月, 3月...）后跟随多列数值数据
 * 模式 2：文本标签 + 固定数量数值行的重复模式（如财务数据表）
 */
function detectAndConvertTables(text: string): string {
  const lines = text.split('\n')
  const monthRe = /^\d{1,2}月$/
  const numberRe = /^-?\d+\.?\d*$/

  // 模式 1：月份表
  let i = 0
  while (i < lines.length) {
    if (!monthRe.test(lines[i])) {
      i++
      continue
    }
    const monthStart = i
    let monthCount = 0
    while (i < lines.length && monthRe.test(lines[i])) {
      monthCount++
      i++
    }
    if (monthCount < 3) continue

    const rowLabels = lines.slice(monthStart, monthStart + monthCount)
    const columns: { header: string; data: string[] }[] = []
    let pos = monthStart + monthCount
    while (pos < lines.length) {
      const headerStart = pos
      while (pos < lines.length && !numberRe.test(lines[pos]) && !monthRe.test(lines[pos])) {
        pos++
      }
      if (pos === headerStart) break
      const header = lines.slice(headerStart, pos).join('')
      const dataValues: string[] = []
      for (let j = 0; j < monthCount && pos < lines.length; j++) {
        if (numberRe.test(lines[pos])) {
          dataValues.push(lines[pos])
          pos++
        } else {
          break
        }
      }
      if (dataValues.length >= 2) {
        columns.push({ header, data: dataValues })
      }
    }
    if (columns.length > 0) {
      const tableEnd = monthStart + monthCount + columns.reduce((sum, c) => sum + 1 + c.data.length, 0)
      const markdownTable = buildMarkdownTable(rowLabels, columns)
      lines.splice(monthStart, tableEnd - monthStart, ...markdownTable)
      i = monthStart + markdownTable.length
    }
  }

  // 模式 2：标签+多列数值（至少 3 行重复模式）
  // 扫描：文本行 + 2个数值 = 一行数据，连续出现 ≥3 次
  i = 0
  while (i < lines.length) {
    // 跳过 markdown 表格行
    if (lines[i].startsWith('|')) {
      i++
      continue
    }

    // 跳过纯数值行（已被模式 1 处理）
    if (numberRe.test(lines[i])) {
      i++
      continue
    }

    // 检查是否是标签行（非数值，后跟 2 个数值）
    if (lines[i].length > 0 && !numberRe.test(lines[i]) && i + 2 < lines.length) {
      if (numberRe.test(lines[i + 1]) && numberRe.test(lines[i + 2])) {
        // 发现潜在表格起点，统计有多少行这样的模式
        const tableStart = i
        const rows: { label: string; values: string[] }[] = []
        while (i < lines.length && lines[i].length > 0 && !numberRe.test(lines[i])) {
          if (i + 2 < lines.length && numberRe.test(lines[i + 1]) && numberRe.test(lines[i + 2])) {
            rows.push({ label: lines[i], values: [lines[i + 1], lines[i + 2]] })
            i += 3
          } else {
            break
          }
        }

        if (rows.length >= 3) {
          // 转换为 markdown 表格
          const mdLines: string[] = []
          mdLines.push('| 指标 | 数值1 | 数值2 |')
          mdLines.push('| --- | --- | --- |')
          for (const row of rows) {
            mdLines.push(`| ${row.label} | ${row.values[0]} | ${row.values[1]} |`)
          }
          lines.splice(tableStart, rows.length * 3, ...mdLines)
          i = tableStart + mdLines.length
        }
      } else {
        i++
      }
    } else {
      i++
    }
  }

  return lines.join('\n')
}

function buildMarkdownTable(rowLabels: string[], columns: { header: string; data: string[] }[]): string[] {
  const lines: string[] = []
  // 表头
  const headerCells = ['时间', ...columns.map((c) => c.header)]
  lines.push('| ' + headerCells.join(' | ') + ' |')
  // 分隔行
  lines.push('| ' + columns.map(() => '---').join(' | ') + ' |')
  // 数据行
  for (let r = 0; r < rowLabels.length; r++) {
    const cells = [rowLabels[r], ...columns.map((c) => c.data[r] ?? '')]
    lines.push('| ' + cells.join(' | ') + ' |')
  }
  return lines
}

/**
 * 预处理 OCR 文字，规范化格式
 */
function normalizeText(raw: string): string {
  let text = raw
    // 统一换行
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // 全角符号转半角
    .replace(/。/g, '.')
    .replace(/．/g, '.')
    .replace(/，/g, ',')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/、/g, '.')

  // OCR 常见形近字纠正：段落标记中的误识别
  text = text.replace(/\(川\)/g, '(三)') // 三 → 川 (形近)

  // 合并多个空行
  text = text.replace(/\n{3,}/g, '\n\n')

  // 修复行首题号紧贴文字: "3.2023年" → "3. 2023年"
  // 条件：后面跟非数字字符，或 4 位数字（年份）
  text = text.replace(/(^|\n)\s*(\d{1,3})\.(\D)/gm, '$1$2. $3')
  text = text.replace(/(^|\n)\s*(\d{1,3})\.(\d{4,})/gm, '$1$2. $3')

  // 修复行首选项紧贴文字: "A.不到5倍" → "A. 不到5倍"
  text = text.replace(/(^|\n)\s*([A-D])\.(\S)/gm, '$1$2. $3')

  // 修复前一行结尾紧接题号: "xxx\n3. yyy" → "xxx\n\n3. yyy"
  // 确保题号在独立行
  text = text.replace(/([^\n])\n(\d{1,3})\.\s/g, '$1\n\n$2. ')

  // 去掉行首行尾多余空格
  text = text
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()

  return text
}

/**
 * 从文字中按题号切分题目
 */
export function splitQuestions(rawText: string): ParsedQuestion[] {
  const text = normalizeText(rawText)
  if (!text) return []

  // 找到所有行首题号
  const QUESTION_NUMBER_RE = /(?:^|\n)\s*(\d{1,3})\.\s+/gm

  const boundaries: { index: number; order: number }[] = []
  let match: RegExpExecArray | null

  while ((match = QUESTION_NUMBER_RE.exec(text)) !== null) {
    const order = parseInt(match[1], 10)
    if (order >= 1 && order <= 200) {
      boundaries.push({ index: match.index, order })
    }
  }

  if (boundaries.length === 0) return []

  // Filter to only keep boundaries that form a valid ascending sequence starting from 1
  const validBoundaries: typeof boundaries = []
  let expectedOrder = 1
  for (const b of boundaries) {
    if (b.order === expectedOrder) {
      validBoundaries.push(b)
      expectedOrder++
    }
  }

  // Detect 资料分析题 section markers: (一) (二) (三) etc.
  // These mark the start of reading materials. Associate each section marker
  // with the NEXT question number boundary — they form ONE question together.
  const sectionMarkerRe = /(?:^|\n)\s*\([一二三四五六七八九十]+\)/gm
  const sectionIndices: number[] = []
  let sm: RegExpExecArray | null
  while ((sm = sectionMarkerRe.exec(text)) !== null) {
    sectionIndices.push(sm.index)
  }

  // For each question boundary, check if a section marker falls between
  // the previous question and this one. If so, extend the start back to include it.
  const adjustedBoundaries = validBoundaries.map((b, idx) => {
    let adjustedStart = b.index
    const prevEnd = idx > 0 ? validBoundaries[idx - 1].index : 0
    for (const secIdx of sectionIndices) {
      if (secIdx > prevEnd && secIdx < b.index) {
        adjustedStart = secIdx
      }
    }
    return { ...b, index: adjustedStart }
  })

  const questions: ParsedQuestion[] = []

  for (let i = 0; i < adjustedBoundaries.length; i++) {
    const startIndex = adjustedBoundaries[i].index
    const endIndex = i < adjustedBoundaries.length - 1 ? adjustedBoundaries[i + 1].index : text.length
    const block = text.slice(startIndex, endIndex).trim()

    if (!block) continue

    const parsed = parseQuestionBlock(block, adjustedBoundaries[i].order)
    if (parsed) {
      // Convert any tables in the question text to markdown format
      parsed.text = detectAndConvertTables(parsed.text)
      questions.push(parsed)
    }
  }

  return questions
}

/**
 * 解析单个题目块：分离题干文本和选项
 */
function parseQuestionBlock(block: string, order: number): ParsedQuestion | null {
  // Remove leading question number (e.g., "1. ") or section marker (e.g., "(一)")
  let body = block.replace(/^\s*\d{1,3}\.\s+/, '').trim()
  body = body.replace(/^\s*\([一二三四五六七八九十]+\)\s*/, '').trim()
  if (!body || body.length < 4) return null

  // 按选项标记 A. B. C. D. 切分
  const parts = body.split(/((?:^|\n)\s*[A-D]\.\s+)/gm)
  // parts 形如: ["question text", "\nA. ", "option A text", "\nB. ", "option B text", ...]

  if (parts.length < 3) {
    // 没有检测到选项分隔
    return {
      order,
      type: '选择题',
      text: body.replace(/\s+/g, ' ').trim(),
      options: [],
    }
  }

  // 题干 = 第一个分隔符之前的部分
  // 保留换行以支持表格检测，只清理行内多余空格
  const questionText = parts[0]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join('\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
  if (!questionText || questionText.length < 3) return null

  // 提取选项（从下标 1 开始，每两个元素为一组：分隔符 + 内容）
  const options: string[] = []
  for (let i = 1; i < parts.length; i += 2) {
    const labelMatch = parts[i].match(/([A-D])/)
    let rawText = i + 1 < parts.length ? parts[i + 1] : ''

    // 最后一个选项：遇到空行 / 段落标记 / 页脚标记就截断
    if (i === parts.length - 2) {
      rawText = rawText.split(
        /\n\s*\n|\n\s*(?=\([一二三四五六七八九十]+\))|\n(?=\s*(?:[\(\（]|本试卷|第\d+页|F\s*粉笔))/,
      )[0]
    }

    const optionText = rawText.replace(/\s+/g, ' ').trim()
    if (labelMatch && optionText) {
      const key = labelMatch[1] as string
      if (!options.find((o) => o.startsWith(key + '.'))) {
        options.push(`${key}. ${optionText}`)
      }
    }
  }

  return {
    order,
    type: '选择题',
    text: questionText,
    options,
  }
}
