/*
 * 教材データ：お礼状の8つの基本（約60秒）
 * ------------------------------------------------------------
 * ここを書き換えるだけで、文章・色・アイコン・秒数を変更できます。
 * 表示のしくみ（app.js）は触らなくてOKです。
 *
 * ■ 文字の書き方
 *   {漢字|かんじ}  … ふりがな付きで表示されます
 *   *ことば*       … 強調（マーカー）表示になります
 *   \n             … 改行
 *
 * ■ 秒数の変え方
 *   各場面の duration（秒）を変えるだけです。例: duration: 5 → 7
 *   合計の再生時間は自動で計算されます。
 *
 * ■ アイコン名は assets/icons.js を参照してください。
 */
window.LESSON = {
  id: 'thank-you-letter',
  title: 'お礼状の8つの基本',
  furigana: true, // 最初にふりがなを表示するか

  // 教材の「項目」。①〜⑧の番号は並び順から自動で付きます。
  items: [
    { label: '{宛名|あてな}',            short: '宛名',       color: '#3567B0', icon: 'person' },
    { label: '{頭語|とうご}',            short: '頭語',       color: '#7550B0', icon: 'pen' },
    { label: '{時候|じこう}の{挨拶|あいさつ}', short: '時候',   color: '#2B9464', icon: 'leaf' },
    { label: '{主文|しゅぶん}',          short: '主文',       color: '#D2506F', icon: 'heart' },
    { label: '{用件|ようけん}',          short: '用件',       color: '#D0721A', icon: 'memo' },
    { label: 'エピソード',               short: 'エピソード', color: '#B07A00', icon: 'bulb' },
    { label: '{結|むす}びの{挨拶|あいさつ}', short: '結び',     color: '#1B8797', icon: 'smile' },
    { label: '{結語|けつご}',            short: '結語',       color: '#8A5A3B', icon: 'flag' }
  ],

  // 場面（シーン）。上から順番に再生されます。
  // type: title / overview / step / flow / ending
  scenes: [
    {
      type: 'title',
      duration: 5,
      lines: ['お{礼状|れいじょう}には', '*8つの{基本|きほん}*があります'],
      sub: '{順番|じゅんばん}に見てみよう！',
      subAt: 2.6 // 「順番に見てみよう！」を出すタイミング（秒）
    },
    {
      type: 'overview',
      duration: 4,
      heading: 'この{順番|じゅんばん}で書きます',
      headingAt: 2.2
    },
    {
      type: 'step',
      duration: 5,
      item: 0,
      desc: 'だれに{送|おく}る{手紙|てがみ}？',
      example: '○○{株式会社|かぶしきがいしゃ}\n○○{様|さま}',
      effect: 'drop',
      icons: ['building', 'person', 'envelope']
    },
    {
      type: 'step',
      duration: 5,
      item: 1,
      desc: '{手紙|てがみ}の{最初|さいしょ}のあいさつ',
      example: '{拝啓|はいけい}',
      effect: 'write',
      size: 'xl',
      icons: ['pen', 'letter']
    },
    {
      type: 'step',
      duration: 5,
      item: 2,
      desc: '{季節|きせつ}に{合|あ}わせたあいさつ',
      example: '{秋晴|あきば}れの{心地|ここち}よい\n{季節|きせつ}となりました。',
      effect: 'fade',
      icons: ['leaf', 'sun'],
      extra: {
        kind: 'seasons',
        pick: 2, // 0=春 1=夏 2=秋 3=冬
        list: [
          { icon: 'flower', label: '春', color: '#E07A9A' },
          { icon: 'sun',    label: '夏', color: '#E0A21A' },
          { icon: 'leaf',   label: '秋', color: '#D0621A' },
          { icon: 'snow',   label: '冬', color: '#4A8CC8' }
        ]
      }
    },
    {
      type: 'step',
      duration: 5,
      item: 3,
      desc: 'まず、お{礼|れい}の{気持|きも}ちを{伝|つた}えます',
      example: '{先日|せんじつ}は{職場見学|しょくばけんがく}を\nさせていただき、\n*ありがとうございました。*',
      effect: 'soft',
      icons: ['heart']
    },
    {
      type: 'step',
      duration: 5,
      item: 4,
      desc: '{何|なに}についてのお{礼|れい}なのかを\n書きます',
      example: '{仕事|しごと}について\n{詳|くわ}しく{教|おし}えていただきました。',
      effect: 'check',
      icons: ['memo']
    },
    {
      type: 'step',
      duration: 5,
      item: 5,
      desc: '{心|こころ}に{残|のこ}ったことを\n{具体的|ぐたいてき}に書きます',
      example: '{商品|しょうひん}を一つずつ\n{丁寧|ていねい}に{確認|かくにん}する{姿|すがた}が\n{印象|いんしょう}に{残|のこ}りました。',
      effect: 'glow',
      icons: ['bulb', 'star'],
      extra: { kind: 'note', icon: 'eye', text: '{自分|じぶん}が見たこと・{感|かん}じたこと' }
    },
    {
      type: 'step',
      duration: 5,
      item: 6,
      desc: '{相手|あいて}を{気|き}づかう{言葉|ことば}で\n{終|お}わります',
      example: '{皆様|みなさま}のますますの\nご{活躍|かつやく}を\nお{祈|いの}り{申|もう}し{上|あ}げます。',
      effect: 'gather',
      icons: ['smile']
    },
    {
      type: 'step',
      duration: 5,
      item: 7,
      desc: '{手紙|てがみ}の{最後|さいご}のあいさつ',
      example: '{敬具|けいぐ}',
      effect: 'write',
      size: 'xl',
      align: 'right',
      icons: ['flag', 'letter'],
      extra: { kind: 'pair', from: '{拝啓|はいけい}', to: '{敬具|けいぐ}', label: 'セットで{使|つか}います' }
    },
    {
      type: 'flow',
      duration: 7,
      heading: 'この{順番|じゅんばん}を\n{覚|おぼ}えよう！',
      start: 0.8,    // 1つ目が光るタイミング（秒）
      interval: 0.6  // 次が光るまでの間隔（秒）
    },
    {
      type: 'ending',
      duration: 4,
      lines: ['{気持|きも}ちが{伝|つた}わる', 'お{礼状|れいじょう}を書こう！'],
      chainBreak: 4 // まとめの一行を何個目で改行するか
    }
  ]
};
