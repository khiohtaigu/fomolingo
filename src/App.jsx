import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { 
  Rocket, Bomb, Zap, Play, Pause, RotateCcw, Menu, X, 
  Volume2, VolumeX, User, Globe, Heart, Star, Radar, 
  Sword, Shield, Sparkles, MessageSquare, Medal, Flame, 
  Gift, BookOpen, Circle, ChevronsUp, Crosshair, Info, AlertTriangle, Layers, Target, Eye, EyeOff, Users, Flashlight, Trophy, List, ArrowLeft, Mic, ChevronRight
} from 'lucide-react';

// --- 正式引入 Firebase ---
import { db } from './firebase'; 
// 引入 Firebase 所有必要函式 (包含計數器需要的 doc, updateDoc, increment, onSnapshot, setDoc)
import { collection, addDoc, getDocs, query, orderBy, limit, where, getCountFromServer, doc, updateDoc, increment, onSnapshot, setDoc } from "firebase/firestore";

// --- 不雅文字過濾器 (包含性別歧視、攻擊性言論過濾) ---
const checkProfanity = (text) => {
  if (!text) return false;
  const lowerText = text.toLowerCase().replace(/\s/g, ''); // 去除空白並轉小寫

  // 禁字清單 (包含中、英、台語諧音、性器官、咒罵、性別歧視)
  const bannedKeywords = [
    // 英文與拼音縮寫
    "fuck", "shit", "bitch", "asshole", "cunt", "dick", "pussy", "nigger", "faggot", "sex", "porn", "whore", "slut",
    "g8", "gy", "ccb", "knn", "cnm", "nmb", "wml", "wtf", "stfu", "suck", "bj", "lp", "l p",
    
    // 性別/性傾向歧視
    "gay", "homo", "lesbian", "娘炮", "死gay", "人妖", "死娘炮", "sissy",

    // 中文/台語 (咒罵與攻擊)
    "幹", "靠北", "靠夭", "靠腰", "雞掰", "機掰", "機車", "擊敗", "王八", "龜孫", 
    "腦殘", "智障", "白痴", "白癡", "傻逼", "智缺", "低能", "垃圾", "畜生", "去死", "死全家",
    "媽的", "他媽", "娘親", "雜種", "狗娘", "井蛙", "台巴子", 
    "操", "肏", // 華語髒話

    // 性器官與猥褻
    "老二", "陰莖", "陰道", "懶叫", "覽叫", "懶覺", "膦", "膣", "屄", "鮑魚", "乳頭", "精液", "做愛", "強姦", "淫",
    "龜頭", "插你", "含棒", "蘭叫", "覽趴", "懶趴", "雞巴", "洨"
  ];

  // 檢查是否包含禁字
  return bannedKeywords.some(keyword => lowerText.includes(keyword));
};

// --- 原始資料庫 (保持 1-705 最新修正) ---
const RAW_DATA = [
  // Page 1
  [1, "阿", "a", []], 
  [2, "阿妗", "a-kīm", []], 
  [3, "阿姆", "a-ḿ", []], 
  [4, "仔", "á", []], 
  [5, "壓霸", "ah-pà", []],
  [6, "曷", "a̍h", []], 
  [7, "抑是", "ah-sī", ["iah-sī", "á-sī"]], 
  [8, "愛", "ài", []], 
  [9, "偝", "āinn", []], 
  [10, "沃", "ak", []],
  [11, "泔", "ám", []], 
  [12, "頷頸", "ām-kún", []], 
  [13, "按呢", "án-ne", []], 
  [14, "按怎", "án-tsuánn", ["àn-tsuánn", "án-nuá", "án-ná"]], 
  [15, "絚", "ân", []],
  [16, "翁", "ang", []], 
  [17, "尪仔", "ang-á", []], 
  [18, "遏", "at", []], 
  [19, "漚", "au", []], 
  [20, "甌", "au", []],
  [21, "拗", "áu", []], 
  [22, "漚", "àu", []], 
  [23, "後日", "āu--ji̍t", ["āu--li̍t"]], // 明後天
  [24, "後日", "āu-ji̍t", ["āu-li̍t"]],   // 以後/未來
  [25, "後壁", "āu-piah", []], 
  [26, "峇", "bā", []],
  [27, "䆀", "bái", []], 
  [28, "目", "ba̍k", []], 
  [29, "茉莉", "ba̍k-nī", []], 
  [30, "目屎", "ba̍k-sái", []], 
  [31, "挽", "bán", []],

  // Page 2
  [32, "蠻皮", "bân-phuê", ["bân-phê", "bân-phêr"]],
  [33, "慢且", "bān-tshiánn", []],
  [34, "蠓", "báng", []],
  [35, "茫", "bâng", ["bông"]],
  [36, "捌", "bat", ["pat"]],
  [37, "密", "ba̍t", []],
  [38, "袂", "bē", ["buē"]],
  [39, "袂當", "bē-tàng", ["buē-tàng"]],
  [40, "欲", "beh", ["bueh", "berh"]],
  [41, "眯", "bî", []],
  [42, "微", "bî", []],
  [43, "沬", "bī", []],
  [44, "覕", "bih", []],
  [45, "抿", "bín", []],
  [46, "敏豆仔", "bín-tāu-á", []],
  [47, "明仔載", "bîn-á-tsài", []],
  [48, "眠夢", "bîn-bāng", []],
  [49, "面", "bīn", []],
  [50, "無", "bô", []],
  [51, "無較縒", "bô-khah-tsua̍h", []],
  [52, "無彩", "bô-tshái", []],
  [53, "罔", "bóng", []],
  [54, "雺", "bông", []],
  [55, "某", "bóo", []],
  [56, "舞", "bú", []],
  [57, "母", "bú", ["bó"]],
  [58, "尾", "bué", ["bé", "bér"]],
  [59, "尾蝶仔", "bué-ia̍h-á", ["bé-ia̍h-á", "bér-ia̍h-á"]],
  [60, "魩仔魚", "but-á-hî", ["but-á-hîr", "but-á-hû"]],
  [61, "的", "ê", []],
  [62, "个", "ê", []],
  [63, "下", "ē", ["e"]],

  // Page 3
  [64, "下", "ē", []],
  [65, "會", "ē", []],
  [66, "下頦", "ē-hâi", []],
  [67, "會當", "ē-tàng", []],
  [68, "狹", "e̍h", []],
  [69, "礙虐", "gāi-gio̍h", ["ngāi-gio̍h"]],
  [70, "愣", "gāng", []],
  [71, "𠢕", "gâu", []],
  [72, "夯", "giâ", []],
  [73, "攑", "gia̍h", []],
  [74, "鋏", "giap", []],
  [75, "挾", "gia̍p", []],
  [76, "扲", "gīm", []],
  [77, "囡仔", "gín-á", []],
  [78, "凝", "gîng", []],
  [79, "戇", "gōng", []],
  [80, "我", "guá", []],
  [81, "外", "guā", []],
  [82, "外", "guā", []],
  [83, "阮", "guán", ["gún"]],
  [84, "外", "guē", []],
  [85, "月娘", "gue̍h-niû", ["ge̍h-niû", "ge̍rh-niû"]],
  [86, "縖", "hâ", []],
  [87, "箬", "ha̍h", []],
  [88, "合", "ha̍h", []],
  [89, "海海", "hái-hái", []],
  [90, "海湧", "hái-íng", []],
  [91, "蚶仔", "ham-á", []],
  [92, "譀", "hàm", []],
  [93, "陷眠", "hām-bîn", []],
  [94, "吼", "háu", []],
  [95, "後生", "hāu-senn", ["hāu-sinn"]],
  [96, "彼", "he", []],
  [97, "下", "hē", []],

  // Page 4
  [98, "遐", "hia", ["hiâ"]],
  [99, "遐的", "hia--ê", ["hua--ê"]],
  [100, "遐的", "hia ê", []],
  [101, "遐", "hiah", []],
  [102, "遐爾", "hiah-nī", []],
  [103, "薟", "hiam", []],
  [104, "掀", "hian", []],
  [105, "現出", "hiàn-tshut", []],
  [106, "現", "hiān", []],
  [107, "現世", "hiān-sì", []],
  [108, "燃", "hiânn", []],
  [109, "㧒", "hiat", []],
  [110, "囂俳", "hiau-pai", ["hia-pai"]],
  [111, "欣羨", "him-siān", []], 
  [112, "形影", "hîng-iánn", []],
  [113, "歇", "hioh", []],
  [114, "雄雄", "hiông-hiông", []],
  [115, "翕", "hip", []],
  [116, "翕", "hip", []],
  [117, "彼", "hit", []],
  [118, "好佳哉", "hó-ka-tsài", []],
  [119, "好勢", "hó-sè", []],
  [120, "風颱", "hong-thai", []],
  [121, "好", "hònn", []],
  [122, "胡蠅", "hôo-sîn", []],
  [123, "予", "hōo", []],
  [124, "撫", "hu", []],
  [125, "拊", "hú", []],
  [126, "喝", "huah", []],
  [127, "橫直", "huâinn-ti̍t", ["huînn-ti̍t"]],
  [128, "翻頭", "huan-thâu", []],
  [129, "凡勢", "huān-sè", []],
  [130, "法度", "huat-tōo", []],
  [131, "花眉仔", "hue-bî-á", []],

  // Page 5
  [132, "費氣", "huì-khì", []],
  [133, "瓷仔", "huî-á", []],
  [134, "薰", "hun", []],
  [135, "粉鳥", "hún-tsiáu", []],
  [136, "份", "hūn", []],
  [137, "伊", "i", []],
  [138, "椅條", "í-liâu", []],
  [139, "奕", "ī", []],
  [140, "也", "iā", ["ā"]],
  [141, "蛾仔", "ia̍h-á", []],
  [142, "緣投", "iân-tâu", []],
  [143, "胭脂", "ian-tsi", []],
  [144, "厭氣", "iàn-khì", []],
  [145, "芫荽", "iân-sui", []],
  [146, "枵", "iau", []],
  [147, "猶", "iáu", ["iah", "ah", "á", "iá"]],
  [148, "陰鴆", "im-thim", []],
  [149, "in", "in", []],
  [150, "往", "íng", []],
  [151, "閒", "îng", []],
  [152, "臆", "ioh", []],
  [153, "勇健", "ióng-kiānn", []],
  [154, "猶原", "iu-guân", []],
  [155, "有孝", "iú-hàu", []],
  [156, "幼秀", "iù-siù", []],
  [157, "遮", "jia", ["lia"]],
  [158, "爪", "jiáu", ["liáu"]],
  [159, "抓", "jiàu", ["liàu"]],
  [160, "撏", "jîm", ["lîm"]],
  [161, "搙", "ji̍ok", ["li̍ok"]],
  [162, "入", "ji̍p", ["li̍p"]],
  [163, "日", "ji̍t", ["li̍t"]],
  [164, "日時", "ji̍t--sî", ["li̍t--sî"]],
  [165, "揉", "jiû", ["liû"]],

  // Page 6
  [166, "鰇魚", "jiû-hî", ["liû-hû", "liû-hîr"]],
  [167, "愈", "jú", ["lú"]],
  [168, "偌", "juā", ["luā"]],
  [169, "熱", "jua̍h", ["lua̍h"]],
  [170, "挼", "juê", ["luê", "lê", "lêr"]],
  [171, "虼", "ka", []],
  [172, "加", "ka", []],
  [173, "交懍恂", "ka-lún-sún", ["ka-líng-sún"]],
  [174, "家己", "ka-tī", ["ka-kī"]],
  [175, "鉸刀", "ka-to", []],
  [176, "敢若", "ká-ná", ["kánn-ná", "kán-ná"]],
  [177, "共", "kā", ["kāng"]],
  [178, "蓋", "kah", []],
  [179, "佮", "kah", ["kap"]],
  [180, "甲", "kah", []],
  [181, "佮意", "kah-ì", []],
  [182, "改", "kái", []],
  [183, "捔", "ka̍k", []],
  [184, "甘", "kam", []],
  [185, "敢", "kám", []],
  [186, "𥴊仔店", "kám-á-tiàm", []],
  [187, "艱苦", "kan-khóo", []],
  [188, "干焦", "kan-na", []],
  [189, "工", "kang", []],
  [190, "港都", "káng-too", []],
  [191, "仝", "kāng", ["kâng"]],
  [192, "敆", "kap", []],
  [193, "狡怪", "káu-kuài", []],
  [194, "到", "kàu", []],
  [195, "加", "ke", []],
  [196, "家後", "ke-āu", []],
  [197, "家婆", "ke-pô", []],
  [198, "家私", "ke-si", []],
  [199, "膎", "kê", ["kuê", "kerê"]],

  // Page 7
  [200, "羹", "kenn", ["kinn"]],
  [201, "跤", "kha", []],
  [202, "咳啾", "kha-tshiùnn", []],
  [203, "尻川", "kha-tshng", []],
  [204, "尻脊", "kha-tsiah", []],
  [205, "跤頭趺", "kha-thâu-u", ["kha-thâu-hu"]],
  [206, "敲", "khà", []],
  [207, "較", "khah", []],
  [208, "較停仔", "khah-thîng-á", []],
  [209, "卡", "kha̍h", []],
  [210, "坎", "khám", []],
  [211, "崁", "khàm", []],
  [212, "崁", "khàm", []],
  [213, "空", "khang", []],
  [214, "空", "khang", []],
  [215, "磕", "kha̍p", []],
  [216, "薅", "khau", []],
  [217, "剾", "khau", []],
  [218, "齧", "khè", ["khuè", "kherè"]],
  [219, "敧", "khi", []],
  [220, "齒戳仔", "khí-thok-á", []],
  [221, "徛", "khiā", []],
  [222, "徛鵝", "khiā-gô", []],
  [223, "掔", "khian", []],
  [224, "勥", "khiàng", []],
  [225, "曲", "khiau", []],
  [226, "巧", "khiáu", []],
  [227, "克虧", "khik-khui", []],
  [228, "拑", "khînn", []],
  [229, "抾", "khioh", []],
  [230, "扱", "khip", []],
  [231, "杙", "khi̍t", []],
  [232, "搝", "khiú", ["giú"]],

  // Page 8
  [233, "虯", "khiû", []],
  [234, "囥", "khǹg", ["khǹg"]],
  [235, "洘", "khó", []],
  [236, "可比", "khó-pí", []],
  [237, "觳", "khok", []],
  [238, "硞", "kho̍k", []],
  [239, "悾", "khong", []],
  [240, "炕", "khòng", []],
  [241, "箍", "khoo", []],
  [242, "跍", "khû", []],
  [243, "款", "khuán", []],
  [244, "看覓", "khuànn-māi", []],
  [245, "快活", "khuìnn-ua̍h", []],
  [246, "睏", "khùn", []],
  [247, "枝", "ki", []],
  [248, "屐", "kia̍h", []],
  [249, "見若", "kiàn-nā", ["kìnn-nā"]],
  [250, "驚", "kiann", []],
  [251, "行", "kiânn", []],
  [252, "筊", "kiáu", []],
  [253, "激", "kik", []],
  [254, "今仔日", "kin-á-ji̍t", ["kin-á-li̍t"]],
  [255, "弓蕉", "kin-tsio", ["kim-tsio", "king-tsio"]],
  [256, "緊", "kín", []],
  [257, "揀", "kíng", []],
  [258, "景緻", "kíng-tì", ["kíng-tī"]],
  [259, "墘", "kînn", []],
  [260, "勼", "kiu", []],
  [261, "糾", "kiù", []],
  [262, "閣", "koh", []],
  [263, "管", "kóng", []],
  [264, "講", "kóng", []],
  [265, "姑不而將", "koo-put-jî-tsiong", ["koo-put-lî-tsiong"]],
  [266, "姑情", "koo-tsiânn", []],

  // Page 9
  [267, "鈷", "kóo", []],
  [268, "古意", "kóo-ì", []],
  [269, "古錐", "kóo-tsui", []],
  [270, "糊", "kôo", []],
  [271, "跔", "ku", []],
  [272, "掛", "kuà", []],
  [273, "蓋", "kuà", []],
  [274, "慣勢", "kuàn-sì", []],
  [275, "懸", "kuân", []],
  [276, "乾", "kuann", []],
  [277, "寒", "kuânn", []],
  [278, "瓜仔哖", "kue-á-nî", []],
  [279, "粿", "kué", ["ké", "kér"]],
  [280, "果子", "kué-tsí", ["ké-tsí", "kér-tsí"]],
  [281, "橛", "kue̍h", []],
  [282, "胿", "kui", []],
  [283, "規", "kui", []],
  [284, "規氣", "kui-khì", []],
  [285, "幾若", "kuí-nā", []],
  [286, "骨力", "kut-la̍t", []],
  [287, "蜊仔", "lâ-á", []],
  [288, "蟧蜈", "lâ-giâ", []],
  [289, "垃圾", "lah-sap", ["lap-sap"]],
  [290, "內", "lāi", []],
  [291, "橐", "lak", []],
  [292, "落", "lak", []],
  [293, "荏懶", "lám-nuā", []],
  [294, "咱", "lán", []],
  [295, "人", "lâng", []],
  [296, "人客", "lâng-kheh", []],
  [297, "籠床", "lâng-sn̂g", []],
  [298, "弄", "lāng", []],
  [299, "塌", "lap", []],
  [300, "扭", "láu", []],

  // Page 10
  [301, "落", "làu", []],
  [302, "老歲仔", "lāu-huè-á", ["lāu-hè-á", "lāu-hèr-á"]],
  [303, "咧", "leh", []],
  [304, "你", "lí", ["lír", "lú"]],
  [305, "掠", "lia̍h", []],
  [306, "連鞭", "liâm-mi", []],
  [307, "輪", "lián", []],
  [308, "撚", "lián", []],
  [309, "輾", "liàn", ["lìn"]],
  [310, "粒仔", "lia̍p-á", []],
  [311, "啉", "lim", []],
  [312, "恁", "lín", []],
  [313, "奶", "ling", ["lin"]],
  [314, "冗", "līng", []],
  [315, "冗", "liōng", []],
  [316, "冗剩", "liōng-siōng", []],
  [317, "鈕", "liú", []],
  [318, "扭搦", "liú-la̍k", []],
  [319, "扭掠", "liú-lia̍h", []],
  [320, "餾", "liū", []],
  [321, "落", "lo̍h", []],
  [322, "橐", "lok", []],
  [323, "漉喙", "lo̍k-tshuì", []],
  [324, "攏", "lóng", []],
  [325, "挵", "lòng", []],
  [326, "惱", "lóo", []],
  [327, "勞力", "lóo-la̍t", []],
  [328, "露螺", "lōo-lê", ["lòo-lê", "lǒo-lêr"]], 
  [329, "攄", "lu", []],
  [330, "鑢", "lù", []],
  [331, "捋", "lua̍h", []],
  [332, "蕊", "luí", []],
  [333, "忍", "lún", []],

  // Page 11
  [334, "毋", "m̄", []],
  [335, "毋過", "m̄-koh", []],
  [336, "毋但", "m̄-nā", ["m̄-niā"]],
  [337, "媽", "má", []],
  [338, "嘛", "mā", []],
  [339, "莫", "mài", []],
  [340, "暝", "mê", ["mî"]],
  [341, "糜", "muê", ["bê", "bêr"]],
  [342, "嚨喉", "nâ-âu", []],
  [343, "若", "nā", []],
  [344, "躡", "neh", ["nih"]],
  [345, "䘼", "ńg", []],
  [346, "黃梔仔花", "n̂g-ki-á-hue", ["n̂g-kinn-á-hue"]],
  [347, "夾", "ngeh", ["ngueh", "gueh"]],
  [348, "莢", "ngeh", ["ngueh", "gueh", "kueh", "kereh"]],
  [349, "挾", "nge̍h", ["ngue̍h", "gue̍h", "ge̍rh"]],
  [350, "擽", "ngiau", []],
  [351, "拈", "ni", []],
  [352, "鳥鼠", "niáu-tshí", ["niáu-tshír", "niáu-tshú"]],
  [353, "娘囝", "niû-kiánn", []],
  [354, "軁", "nǹg", []], 
  [355, "卵", "nn̄g", []],
  [356, "撋", "nuá", []],
  [357, "瀾", "nuā", []],
  [358, "呵咾", "o-ló", []],
  [359, "蚵", "ô", []],
  [360, "僫", "oh", []],
  [361, "烏", "oo", []],
  [362, "烏暗", "oo-àm", []],
  [363, "挖", "óo", []],
  [364, "爸", "pa", ["pâ"]],
  [365, "瓶", "pân", []],

  // Page 12
  [366, "範勢", "pān-sè", []],
  [367, "枋", "pang", []],
  [368, "爸", "pē", []],
  [369, "擘", "peh", []],
  [370, "葩", "pha", []],
  [371, "拍", "phah", []],
  [372, "拍呃", "phah-eh", []],
  [373, "拍算", "phah-sǹg", []],
  [374, "歹", "pháinn", ["phái"]],
  [375, "歹勢", "pháinn-sè", ["phái-sè"]],
  [376, "揹", "phāinn", []],
  [377, "芳", "phang", []],
  [378, "捀", "phâng", []],
  [379, "冇", "phànn", []],
  [380, "抨", "phiann", []],
  [381, "品仔", "phín-á", []],
  [382, "鼻", "phīnn", ["phī", "phǐ"]],
  [383, "粕", "phoh", []],
  [384, "豐沛", "phong-phài", []],
  [385, "捧", "phóng", []],
  [386, "膨", "phòng", []],
  [387, "蘋果", "phōng-kó", []],
  [388, "鋪", "phoo", []],
  [389, "舖", "phòo", []],
  [390, "扶", "phôo", []],
  [391, "殕", "phú", []],
  [392, "批", "phue", []],
  [393, "呸", "phuì", []],
  [394, "潘", "phun", []],
  [395, "觱", "pi", []],
  [396, "煏", "piak", []],
  [397, "便所", "piān-sóo", []],
  [398, "摒", "piànn", []],
  [399, "拚", "piànn", []],

  // Page 13
  [400, "撆", "pih", []],
  [401, "貧惰", "pîn-tuānn", ["pûn-tuānn", "pân-tuānn"]],
  [402, "反", "píng", []],
  [403, "爿", "pîng", []],
  [404, "保庇", "pó-pì", []],
  [405, "碰", "pōng", []],
  [406, "磅", "pōng", []],
  [407, "磅米芳", "pōng-bí-phang", []],
  [408, "磅空", "pōng-khang", []],
  [409, "磅子", "pōng-tsí", []],
  [410, "埔", "poo", []],
  [411, "脯", "póo", []],
  [412, "富", "pù", []],
  [413, "盤", "puânn", []],
  [414, "盤撋", "puânn-nuá", []],
  [415, "菠薐仔", "pue-lîng-á", ["per-lîng-á", "pe-lîng-á"]],
  [416, "掰", "pué", []],
  [417, "培墓", "puē-bōng", ["pē-bōo", "pēr-bōo", "pěr-bōo"]],
  [418, "糞埽", "pùn-sò", []],
  [419, "歕", "pûn", []],
  [420, "捎", "sa", []],
  [421, "煠", "sa̍h", []],
  [422, "捒", "sak", []],
  [423, "瘦", "sán", []],
  [424, "散赤", "sàn-tshiah", []],
  [425, "散食", "sàn-tsia̍h", []],
  [426, "衫", "sann", []],
  [427, "霎", "sap", []],
  [428, "梢聲", "sau-siann", []],
  [429, "嗽", "sàu", []],
  [430, "細", "sè", ["suè", "serè"]],

  // Page 14
  [431, "踅", "se̍h", ["ser̍h"]],
  [432, "生", "senn", ["sinn"]],
  [433, "生成", "senn-sîng", ["sinn-sîng", "sinn-tsiânn"]],
  [434, "世", "sì", []],
  [435, "四界", "sì-kè", ["sì-kuè", "sì-kerè"]],
  [436, "序大", "sī-tuā", []],
  [437, "閃爍", "siám-sih", []],
  [438, "鉎", "sian", ["san"]],
  [439, "仙", "sián", []],
  [440, "𤺪", "siān", []], 
  [441, "蟮蟲仔", "siān-thâng-á", []],
  [442, "啥", "siánn", ["sánn"]],
  [443, "啥物", "siánn-mih", []],
  [444, "唌", "siânn", []],
  [445, "痟", "siáu", []],
  [446, "數", "siàu", []],
  [447, "數念", "siàu-liām", []],
  [448, "少年", "siàu-liân", []],
  [449, "數想", "siàu-siūnn", []],
  [450, "爍爁", "sih-nah", ["sinnh-nà"]],
  [451, "熟似", "si̍k-sāi", []],
  [452, "心酸", "sim-sng", []],
  [453, "身軀", "sin-khu", ["sing-khu"]],
  [454, "新婦", "sin-pū", ["sim-pū"]],
  [455, "承", "sîn", []],
  [456, "相借問", "sio-tsioh-mn̄g", []],
  [457, "小可仔", "sió-khuá-á", []],
  [458, "液", "sio̍h", []],
  [459, "上", "siōng", []],
  [460, "四秀仔", "sì-siù-á", []],
  [461, "失志", "sit-tsì", []],
  [462, "岫", "siū", []],
  [463, "受氣", "siū-khì", ["siūnn-khì", "siǔnn-khì"]],

  // Page 15
  [464, "傷", "siunn", []],
  [465, "耍", "sńg", []],
  [466, "挲", "so", []],
  [467, "鎖匙", "só-sî", []],
  [468, "趖", "sô", []],
  [469, "索", "soh", []],
  [470, "倯", "sông", []],
  [471, "所費", "sóo-huì", []],
  [472, "軀", "su", []],
  [473, "思慕", "su-bōo", []],
  [474, "徙", "suá", []],
  [475, "紲", "suà", []],
  [476, "煞", "suah", []],
  [477, "漩", "suān", []],
  [478, "璇石", "suān-tsio̍h", []],
  [479, "散", "suànn", []],
  [480, "欶", "suh", []],
  [481, "媠", "suí", []],
  [482, "隨", "suî", []],
  [483, "隨在", "suî-tsāi", []],
  [484, "巡", "sûn", []],
  [485, "焦", "ta", []],
  [486, "大家", "ta-ke", []],
  [487, "大官", "ta-kuann", []],
  [488, "罩", "tà", []],
  [489, "呆", "tai", []],
  [490, "代誌", "tāi-tsì", []],
  [491, "逐", "ta̍k", []],
  [492, "澹", "tâm", []],
  [493, "淡薄仔", "tām-po̍h-á", []],
  [494, "擲", "tàn", []],
  [495, "霆", "tân", []],
  [496, "冬", "tang", []],
  [497, "當時", "tang-sî", []],

  // Page 16
  [498, "凍霜", "tàng-sng", []],
  [499, "今", "tann", []],
  [500, "兜", "tau", []],
  [501, "鬥", "tàu", []],
  [502, "鬥相共", "tàu-sann-kāng", []],
  [503, "沓", "ta̍uh", []],
  [504, "貯", "té", ["tué", "teré"]],
  [505, "硩", "teh", []],
  [506, "癩𰣻", "thái-ko", []],
  [507, "刣", "thâi", []],
  [508, "趁", "thàn", []],
  [509, "通", "thang", []],
  [510, "迵", "thàng", []],
  [511, "痛", "thàng", []],
  [512, "窒", "that", []],
  [513, "敨", "tháu", []],
  [514, "透早", "thàu-tsá", []],
  [515, "頭", "thâu", []],
  [516, "頭路", "thâu-lōo", []],
  [517, "退", "thè", ["thèr"]],
  [518, "替換", "thè-uānn", ["thuè-uānn"]],
  [519, "提", "the̍h", ["thue̍h", "there̍h", "ther̍h"]],
  [520, "褫", "thí", []],
  [521, "忝", "thiám", []],
  [522, "疼", "thiànn", []],
  [523, "刁工", "thiau-kang", ["tiau-kang"]],
  [524, "斟", "thîn", []],
  [525, "伨", "thīn", []],
  [526, "褪", "thǹg", []],
  [527, "討債", "thó-tsè", []],
  [528, "捅", "thóng", []],
  [529, "土", "thóo", []],
  [530, "塗", "thôo", []],

  // Page 17
  [531, "拖", "thua", []],
  [532, "挩", "thuah", []],
  [533, "屜", "thuah", []],
  [534, "托", "thuh", []],
  [535, "黜", "thuh", []],
  [536, "坉", "thūn", []],
  [537, "智識", "tì-sik", []],
  [538, "箸", "tī", ["tīr", "tū"]],
  [539, "佇", "tī", ["tīr", "tū"]],
  [540, "踮", "tiàm", ["tàm"]],
  [541, "顛倒", "tian-tò", []],
  [542, "鼎", "tiánn", []],
  [543, "埕", "tiânn", []],
  [544, "定定", "tiānn-tiānn", []],
  [545, "定定", "tiānn-tiānn", []], 
  [546, "定著", "tiānn-tio̍h", []],
  [547, "牢", "tiâu", []],
  [548, "抌", "tìm", []],
  [549, "鎮位", "tìn-uī", []],
  [550, "陣", "tīn", []],
  [551, "頂", "tíng", []],
  [552, "亭仔跤", "tîng-á-kha", []],
  [553, "𠕇", "tīng", []], 
  [554, "滇", "tīnn", []],
  [555, "趒", "tiô", []],
  [556, "著", "tio̍h", []],
  [557, "中晝", "tiong-tàu", []],
  [558, "得", "tit", []],
  [559, "張持", "tiunn-tî", []],
  [560, "轉", "tńg", []],
  [561, "頓", "tǹg", []],
  [562, "搪", "tn̄g", []],
  [563, "都", "to", []],
  [564, "佗位", "tó-uī", []],

  // Page 18
  [565, "倒", "tò", []],
  [566, "倒摔向", "tò-siàng-hiànn", ["tò-siak-hiànn"]],
  [567, "就", "tō", ["tio̍h", "to̍h", "tiō", "tsiū"]],
  [568, "著", "to̍h", ["tio̍h"]],
  [569, "剁", "tok", []],
  [570, "啄龜", "tok-ku", []],
  [571, "當做", "tòng-tsò", ["tòng-tsuè"]],
  [572, "撞", "tōng", []],
  [573, "杜蚓", "tōo-kún", ["tōo-ún"]],
  [574, "查某", "tsa-bóo", []],
  [575, "昨昏", "tsa-hng", []],
  [576, "查埔", "tsa-poo", []],
  [577, "紮", "tsah", []],
  [578, "閘", "tsa̍h", []],
  [579, "知", "tsai", []],
  [580, "才調", "tsâi-tiāu", []],
  [581, "蹔", "tsàm", []],
  [582, "站", "tsām", []],
  [583, "站節", "tsām-tsat", []],
  [584, "欉", "tsâng", []],
  [585, "乍", "tsànn", []],
  [586, "雜唸", "tsa̍p-liām", []],
  [587, "節", "tsat", []],
  [588, "實", "tsa̍t", []],
  [589, "走", "tsáu", []],
  [590, "走味", "tsáu-bī", []],
  [591, "灶", "tsàu", []],
  [592, "這", "tse", []],
  [593, "濟", "tsē", ["tsuē", "tserē"]],
  [594, "鑿目", "tsha̍k-ba̍k", []],
  [595, "摻", "tsham", []],
  [596, "參", "tsham", []],
  [597, "草蜢仔", "tsháu-meh-á", []],
  [598, "冊", "tsheh", []],

  // Page 19
  [599, "青", "tshenn", ["tshinn"]],
  [600, "生份", "tshenn-hūn", ["sinn-hūn", "tshinn-hūn"]],
  [601, "青盲", "tshenn-mê", ["tshinn-mî"]],
  [602, "刺毛蟲", "tshì-môo-thâng", ["tshì-moo-thâng"]],
  [603, "車", "tshia", []],
  [604, "刺", "tshiah", []],
  [605, "攕", "tshiám", []],
  [606, "唱聲", "tshiàng-siann", []],
  [607, "倩", "tshiànn", []],
  [608, "搜", "tshiau", []],
  [609, "撨", "tshiâu", []],
  [610, "揤", "tshi̍h", ["ji̍h"]],
  [611, "粟", "tshik", []],
  [612, "親像", "tshin-tshiūnn", ["tshan-tshiūnn"]],
  [613, "親情", "tshin-tsiânn", []],
  [614, "凊彩", "tshìn-tshái", []],
  [615, "清氣", "tshing-khì", []],
  [616, "清芳", "tshing-phang", []],
  [617, "擤", "tshǹg", ["tshìng"]], // 修正 [617]
  [618, "穿", "tshīng", []],
  [619, "鮮", "tshinn", []],
  [620, "笑咍咍", "tshiò-hai-hai", []],
  [621, "拭", "tshit", []],
  [622, "𨑨迌", "tshit-thô", []],
  [623, "手電仔", "tshiú-tiān-á", []],
  [624, "吮", "tshńg", []], // 修正 [624]
  [625, "創", "tshòng", []],
  [626, "創治", "tshòng-tī", []],
  [627, "趨", "tshu", []],
  [628, "厝", "tshù", []],
  [629, "跙", "tshū", []],
  [630, "𤆬", "tshuā", []], 

  // Page 20
  [631, "娶", "tshuā", []],
  [632, "疶", "tshuah", []],
  [633, "礤", "tshuah", []],
  [634, "掣", "tshuah", []],
  [635, "攢", "tshuân", []],
  [636, "扦", "tshuann", []],
  [637, "炊", "tshue", ["tshe", "tsher"]],
  [638, "箠", "tshuê", ["tshê", "tshêr"]],
  [639, "揣", "tshuē", ["tshê", "tshēr"]], // 修正：tshuē, tshê, tshēr
  [640, "喙", "tshuì", []],
  [641, "喙䫌", "tshuì-phué", ["tshuì-phé"]],
  [642, "喙脣", "tshuì-tûn", []],
  [643, "賰", "tshun", []],
  [644, "糍", "tsî", []],
  [645, "遮", "tsia", ["tsiâ"]],
  [646, "遮的", "tsia--ê", []],
  [647, "遮的", "tsia ê", []],
  [648, "才", "tsiah", []],
  [649, "遮", "tsiah", []],
  [650, "遮爾", "tsiah-nī", []],
  [651, "食", "tsia̍h", []],
  [652, "針黹", "tsiam-tsí", []],
  [653, "煎", "tsian", []],
  [654, "汫", "tsiánn", []],
  [655, "誠", "tsiânn", []],
  [656, "成", "tsiânn", []],
  [657, "照起工", "tsiàu-khí-kang", []],
  [658, "寂寞", "tsi̍k-bo̍k", ["tsi̍t-bo̍k"]],
  [659, "唚", "tsim", []],
  [660, "斟酌", "tsim-tsiok", []],
  [661, "舂", "tsing", []],
  [662, "從", "tsîng", []],
  [663, "櫼", "tsinn", []],
  [664, "茈", "tsínn", []],

  // Page 21
  [665, "糋", "tsìnn", []],
  [666, "舐", "tsīnn", ["tsn̄g", "tsǐnn"]],
  [667, "少", "tsió", []],
  [668, "這", "tsit", []],
  [669, "這馬", "tsit-má", []],
  [670, "一寡仔", "tsi̍t-kuá-á", []],
  [671, "守", "tsiú", []],
  [672, "咒誓", "tsiù-tsuā", []],
  [673, "就", "tsiū", []],
  [674, "螿蜍", "tsiunn-tsî", ["tsiunn-tsîr", "tsiunn-tsû"]],
  [675, "做伙", "tsò-hué", ["tsuè-hé", "tserè-hér"]],
  [676, "作穡", "tsoh-sit", []],
  [677, "昨日", "tso̍h--ji̍t", ["tso̍h--li̍t", "tsoh-li̍t"]],
  [678, "苴", "tsū", []],
  [679, "逝", "tsuā", []],
  [680, "煎", "tsuann", []],
  [681, "炸", "tsuànn", []],
  [682, "水雞", "tsuí-ke", ["tsuí-kue"]], // PDF 682
  [683, "陣", "tsūn", []],
  [684, "拄", "tú", []],
  [685, "注", "tù", []],
  [686, "駐", "tū", []],
  [687, "蹛", "tuà", []],
  [688, "大肚胿仔", "tuā-tōo-kuai-á", ["tuā-tōo-kui-á"]],
  [689, "綴", "tuè", ["tè", "tèr"]],
  [690, "盹龜", "tuh-ku", []],
  [691, "揬", "tu̍h", []],
  [692, "倚", "uá", []],
  [693, "冤家", "uan-ke", []],
  [694, "怨嘆", "uàn-thàn", []],
  [695, "晏", "uànn", []],
  [696, "斡", "uat", []],

  // Page 22 (New Items)
  [697, "越", "ua̍t", []],
  [698, "揻", "ui", []],
  [699, "搵", "ùn", []],
  [700, "鬱卒", "ut-tsut", []],
  [701, "鵝", "gô", ["giâ"]],
  [702, "挂", "kuì", []],
  [703, "釘", "ting", ["tan"]],
  [704, "蟮螂", "siān-lâng", ["siān-lâng"]] 
];

const processRawData = (raw) => {
  const symbolToNum = { 
    'á': 'a2', 'à': 'a3', 'â': 'a5', 'ā': 'a7', 'a̍': 'a8', 
    'é': 'e2', 'è': 'e3', 'ê': 'e5', 'ē': 'e7', 'e̍': 'e8', 
    'í': 'i2', 'ì': 'i3', 'î': 'i5', 'ī': 'i7', 'i̍': 'i8', 
    'ó': 'o2', 'ò': 'o3', 'ô': 'o5', 'ō': 'o7', 'o̍': 'o8', 
    'ú': 'u2', 'ù': 'u3', 'û': 'u5', 'ū': 'u7', 'u̍': 'u8', 
    'ḿ': 'm2', 'm̀': 'm3', 'm̂': 'm5', 'm̄': 'm7', 'm̍': 'm8',
    'ń': 'n2', 'ǹ': 'n3', 'n̂': 'n5', 'n̄': 'n7', 'n̍': 'n8',
    'ǹ': 'n3', 'ǹ': 'n3'  
  };
  
  const getNumeric = (text) => { 
    if (!text) return "";
    let res = text.normalize('NFC').toLowerCase(); 
    Object.keys(symbolToNum).forEach(sym => { res = res.replaceAll(sym, symbolToNum[sym]); }); 
    return res.split('-').map(part => {
        const match = part.match(/([a-z]+)(\d)([a-z]*)/);
        if (match) { return match[1] + match[3] + match[2]; }
        return part;
    }).join('-');
  };
  
  const getPOJ = (tailo) => { 
      if (!tailo) return "";
      let poj = tailo.toLowerCase(); 
      poj = poj.replaceAll('ts', 'ch')
               .replaceAll('uà', 'oà').replaceAll('ua', 'oa')
               .replaceAll('uè', 'oè').replaceAll('ue', 'oe')
               .replaceAll('ing', 'eng').replaceAll('ik', 'ek'); 
      return poj; 
  };
  
  return raw.map(item => { 
    const [id, hanzi, tailo, alts] = item; 
    
    // 改名: displayTailo 改為使用 "海口腔" (若有替代音)，否則使用 "通行腔"
    const displayTailo = (alts && alts.length > 0) ? alts[0] : tailo;
    const displayPoj = getPOJ(displayTailo);
    const generalPoj = getPOJ(tailo); // 通行腔POJ

    const matchCandidates = new Set();
    
    const addCandidates = (src) => {
        if (!src) return;
        const normalizedSrc = src.normalize('NFC').toLowerCase();
        const num = getNumeric(src);
        const poj = getPOJ(src);
        const num_poj = getNumeric(poj);
        
        matchCandidates.add(normalizedSrc);
        matchCandidates.add(num);
        matchCandidates.add(num.replace(/-/g, ''));
        matchCandidates.add(poj);
        matchCandidates.add(num_poj);
        matchCandidates.add(num_poj.replace(/-/g, ''));
    };

    addCandidates(tailo);
    if (alts && alts.length > 0) {
        alts.forEach(alt => addCandidates(alt));
    }

    const score = 50 + (tailo.length * 5); 
    
    return { 
        id, hanzi, 
        generalTailo: tailo, 
        generalPoj,
        haikouTailo: displayTailo, 
        haikouPoj: displayPoj,
        matchCandidates: Array.from(matchCandidates), 
        score 
    }; 
  });
};

const INITIAL_WORD_DATABASE = processRawData(RAW_DATA);
const shuffleArray = (array) => { const newArr = [...array]; for (let i = newArr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [newArr[i], newArr[j]] = [newArr[j], newArr[i]]; } return newArr; };
const toneMap = { 'a1': 'a', 'a2': 'á', 'a3': 'à', 'a4': 'ah', 'a5': 'â', 'a6': 'ǎ', 'a7': 'ā', 'a8': 'a̍', 'e1': 'e', 'e2': 'é', 'e3': 'è', 'e4': 'eh', 'e5': 'ê', 'e6': 'ě', 'e7': 'ē', 'e8': 'e̍', 'i1': 'i', 'i2': 'í', 'i3': 'ì', 'i4': 'ih', 'i5': 'î', 'i6': 'ǐ', 'i7': 'ī', 'i8': 'i̍', 'o1': 'o', 'o2': 'ó', 'o3': 'ò', 'o4': 'oh', 'o5': 'ô', 'o6': 'ǒ', 'o7': 'ō', 'o8': 'o̍', 'u1': 'u', 'u2': 'ú', 'u3': 'ù', 'u4': 'uh', 'u5': 'û', 'u6': 'ǔ', 'u7': 'ū', 'u8': 'u̍', 'm1': 'm', 'm2': 'ḿ', 'm3': 'm̀', 'm4': 'mh', 'm5': 'm̂', 'm6': 'm̌', 'm7': 'm̄', 'm8': 'm̍', 'n1': 'n', 'n2': 'ń', 'n3': 'ǹ', 'n4': 'nh', 'n5': 'n̂', 'n6': 'ň', 'n7': 'n̄', 'n8': 'n̍' };
const processInput = (text) => { let result = text.toLowerCase(); Object.keys(toneMap).forEach(key => { result = result.replaceAll(key, toneMap[key]); }); return result.normalize('NFC'); };
const getPlayerRank = (score) => { if (score >= 3000) return { title: "絕地大師 (Jedi Master)", color: "text-purple-400", icon: <Star className="w-6 h-6 text-purple-400" /> }; if (score >= 1500) return { title: "絕地武士 (Jedi Knight)", color: "text-blue-400", icon: <Sword className="w-6 h-6 text-blue-400" /> }; if (score >= 500) return { title: "學徒 (Padawan)", color: "text-green-400", icon: <Zap className="w-6 h-6 text-green-400" /> }; return { title: "幼徒 (Youngling)", color: "text-gray-400", icon: <User className="w-6 h-6 text-gray-400" /> }; };

const StarBackground = memo(() => ( <div className="fixed inset-0 overflow-hidden pointer-events-none z-0"> {Array.from({ length: 40 }).map((_, i) => ( <div key={i} className="absolute bg-white rounded-full opacity-60" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, width: `${Math.random() * 2 + 1}px`, height: `${Math.random() * 2 + 1}px`, animation: `twinkle ${Math.random() * 3 + 2}s infinite` }} /> ))} </div> ));
const VisitCounter = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const initCounter = async () => {
      // 連結到 system_stats 集合下的 visitors 文件
      const counterRef = doc(db, "system_stats", "visitors");

      try {
        // 嘗試將雲端數字 +1
        await updateDoc(counterRef, {
          count: increment(1)
        });
      } catch (err) {
        // 如果文件不存在（第一次），則建立它
        console.log("Creating counter...", err);
        await setDoc(counterRef, { count: 1 });
      }

      // 即時監聽：只要雲端數字一變，這裡馬上更新
      const unsubscribe = onSnapshot(counterRef, (docSnap) => {
        if (docSnap.exists()) {
          setCount(docSnap.data().count);
        }
      });

      return () => unsubscribe();
    };

    initCounter();
  }, []);

  return (
    <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur border border-blue-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-xs md:text-sm text-blue-300 z-50">
      <Users size={14} />
      <span>Pilots Trained: <span className="text-yellow-400 font-mono font-bold">{count.toLocaleString()}</span></span>
    </div>
  );
};

const LeaderboardScreen = memo(({ onBack, defaultDifficulty = 'A' }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDifficulty, setFilterDifficulty] = useState(defaultDifficulty);

  useEffect(() => {
    const fetchLeaders = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "leaderboard"), where("difficulty", "==", filterDifficulty), orderBy("score", "desc"), limit(20));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeaders(data);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
  }, [filterDifficulty]);

  return (
    <div className="flex flex-col items-center h-full w-full relative z-10 max-w-2xl mx-auto pt-2">
      <h2 className="text-3xl text-yellow-400 mb-2 font-bold tracking-wider flex items-center gap-2"><Trophy /> 英雄榜</h2>
      <div className="flex gap-2 mb-2">
          {['A', 'B', 'C'].map(d => (
              <button key={d} onClick={() => setFilterDifficulty(d)} className={`px-4 py-1 rounded-full font-bold text-sm ${filterDifficulty === d ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}>
                  {d === 'A' ? '簡單' : d === 'B' ? '普通' : '困難'}
              </button>
          ))}
      </div>
      <div className="w-full flex-1 min-h-0 bg-gray-900/90 border border-yellow-500/30 rounded-xl overflow-hidden mb-2 flex flex-col">
        <div className="grid grid-cols-4 bg-yellow-500/20 p-2 text-yellow-300 font-bold uppercase text-xs shrink-0">
          <div>Rank</div><div>Pilot</div><div>Score</div><div>Date</div>
        </div>
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {loading ? ( <div className="p-4 text-center text-gray-400">Loading data...</div> ) : (
            leaders.length > 0 ? leaders.map((entry, index) => (
              <div key={entry.id} className={`grid grid-cols-4 p-2 border-b border-gray-800 text-xs ${index < 3 ? 'text-white font-bold' : 'text-gray-300'}`}>
                <div className="flex items-center gap-2">{index === 0 ? <Medal size={14} className="text-yellow-400" /> : index === 1 ? <Medal size={14} className="text-gray-300" /> : index === 2 ? <Medal size={14} className="text-orange-400" /> : <span className="w-4 text-center">{index + 1}</span>}</div>
                <div className="truncate">{entry.name}</div>
                <div className="font-mono text-yellow-500">{entry.score}</div>
                <div className="text-[10px] text-gray-500">{entry.timestamp?.toDate ? new Date(entry.timestamp.toDate()).toLocaleDateString() : '-'}</div>
              </div>
            )) : <div className="p-4 text-center text-gray-500">暫無資料</div>
          )}
        </div>
      </div>
      {onBack && <button onClick={onBack} className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors">返回首頁</button>}
    </div>
  );
});

const Spaceship = memo(({ score, inputValue, compact, inline = false }) => {
  const TOTAL_SHIP_DESIGNS = 8; const SCORE_PER_LEVEL = 300;
  let level = Math.min(TOTAL_SHIP_DESIGNS, Math.floor(score / SCORE_PER_LEVEL) + 1); level = Math.max(1, level);
  const rotation = Math.max(-20, Math.min(20, (inputValue.length - 3) * 5));
  const sizeClass = compact ? "w-12 h-12" : "w-20 h-20 md:w-32 md:h-32";
  const transformStyle = inline ? { transform: `rotate(${rotation}deg)` } : { transform: `translate(-50%, 0) rotate(${rotation}deg)` };
  let engineColorClass = "text-gray-400"; let engineGlowClass = "drop-shadow-[0_0_5px_rgba(200,200,200,0.5)]";
  if (level >= 7) { engineColorClass = "text-yellow-400"; engineGlowClass = "drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]"; }
  else if (level >= 5) { engineColorClass = "text-orange-400"; engineGlowClass = "drop-shadow-[0_0_12px_rgba(255,100,0,0.6)]"; }
  else if (level >= 3) { engineColorClass = "text-cyan-400"; engineGlowClass = "drop-shadow-[0_0_10px_rgba(0,255,255,0.6)]"; }
  else if (level >= 2) { engineColorClass = "text-blue-400"; engineGlowClass = "drop-shadow-[0_0_8px_rgba(50,100,255,0.6)]"; }
  return ( <div className={`relative ${sizeClass} transition-all duration-500 ease-out flex-shrink-0`} style={transformStyle}> <svg viewBox="0 0 32 32" className={`w-full h-full ${engineGlowClass}`} fill="none" stroke="currentColor" strokeWidth="1.5"> {level === 1 && <path d="M16 2 L4 26 L16 22 L28 26 L16 2 Z" className="text-gray-500 fill-gray-900" />} {level >= 2 && <path d="M16 2 L8 24 L16 20 L24 24 L16 2 Z" className="text-blue-300 fill-gray-900" />} <path d="M16 22 L16 30" className={engineColorClass} strokeWidth="2" /> </svg> </div> );
});

const LightningBolt = memo(({ startX, startY, endX, endY }) => {
    const generateLightningPath = () => { const segments = 12; const dx = endX - startX; const dy = endY - startY; let path = `M ${startX} ${startY}`; for (let i = 1; i < segments; i++) { const t = i / segments; const noise = (Math.random() - 0.5) * 8; const x = startX + dx * t + noise; const y = startY + dy * t; path += ` L ${x} ${y}`; } path += ` L ${endX} ${endY}`; return path; };
    return ( <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" style={{ overflow: 'visible' }} viewBox="0 0 100 100" preserveAspectRatio="none"> <path d={generateLightningPath()} stroke="white" strokeWidth="0.6" fill="none" className="animate-flash" /> <path d={generateLightningPath()} stroke="#A855F7" strokeWidth="1.5" fill="none" className="drop-shadow-[0_0_8px_rgba(168,85,247,1)] animate-flash opacity-80" /> </svg> );
});

const WaveNotification = memo(({ waveMessage }) => {
  if (!waveMessage) return null;
  return ( <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center animate-pulse pointer-events-none text-center w-3/4 md:w-2/3"> <div className="bg-red-900/90 border-y-4 border-red-500 w-full py-6 backdrop-blur-md shadow-[0_0_50px_rgba(220,38,38,0.5)] rounded-lg"> <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-red-100 text-3xl md:text-5xl font-black tracking-widest uppercase mb-2"> <AlertTriangle size={48} className="text-red-500" />{waveMessage.text}<AlertTriangle size={48} className="text-red-500" /> </div> <div className="text-red-300 font-mono text-xl tracking-[0.5em]">{waveMessage.subtext}</div> </div> </div> );
});

const WordLayer = memo(({ words, projectiles, explosions, system, accent, displayMode, particles }) => {
  return (
    <>
      {words.map(word => {
          let displayText = "";
          if (system === 'poj') {
              displayText = (accent === 'haikou') ? word.haikouPoj : word.generalPoj;
          } else {
              displayText = (accent === 'haikou') ? word.haikouTailo : word.generalTailo;
          }

          return (
            <div key={word.id} className={`absolute transform -translate-x-1/2 flex flex-col items-center transition-transform duration-300 z-10 ${word.isLocked ? 'scale-110' : ''}`} style={{ left: `${word.x}%`, top: `${word.y}%`, transition: 'transform 0.1s' }}>
            {word.isLocked && <div className="absolute inset-0 -m-4 border-2 border-red-500 rounded-full animate-ping opacity-50"></div>}
            <div className={`text-3xl md:text-5xl font-black drop-shadow-[0_0_5px_rgba(0,0,0,0.8)] tracking-wide ${word.isLocked ? 'text-yellow-400' : 'text-white'} stroke-black`} style={{ textShadow: '0 0 4px #000' }}>{word.hanzi}</div>
            {(displayMode === 'hint' || word.isRevealed) && ( <div className={`text-xs md:text-base font-mono px-2 rounded mt-1 border backdrop-blur-sm ${word.isLocked ? 'bg-red-900/80 border-red-400 text-white' : 'bg-black/60 border-blue-500/30 text-blue-300'}`}> {displayText} </div> )}
            </div>
          );
      })}
      {projectiles.map(p => {
          if (p.type === 'normal') { return ( <div key={p.id} className="absolute w-2 h-2 pointer-events-none z-20" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%, -50%)` }}><div className="w-full h-full bg-yellow-300 rounded-full shadow-[0_0_5px_yellow]"></div></div> ); } 
          else if (p.type === 'missile') { return ( <div key={p.id} className="absolute w-4 h-8 pointer-events-none z-20" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%, -50%) rotate(${p.angle + 45}deg)` }}><Rocket size={24} className="text-red-500 drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]" fill="currentColor"/><div className="absolute top-full left-1/2 -translate-x-1/2 w-1 h-3 bg-orange-500 blur-[1px]"></div></div> ); } 
          else if (p.type === 'beam') { return ( <div key={p.id} className="absolute w-1.5 h-16 pointer-events-none z-20" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%, -50%) rotate(${p.angle + 90}deg)` }}><div className="w-full h-full bg-cyan-300 rounded-full shadow-[0_0_8px_#00ffff]"></div></div> ); } 
          else if (p.type === 'lightning') { return ( <div key={p.id} className="absolute inset-0 pointer-events-none z-30"><LightningBolt startX={50} startY={85} endX={p.targetX} endY={p.targetY} /></div> ); } 
          return null;
      })}
      {explosions.map(exp => (
        <div key={exp.id} className="absolute pointer-events-none z-30 flex items-center justify-center" style={{ left: `${exp.x}%`, top: `${exp.y}%`, transform: 'translate(-50%, -50%)' }}>
           <div className="absolute w-20 h-20 border-4 border-yellow-300 rounded-full animate-blast-wave"></div>
           <div className="absolute w-16 h-16 bg-orange-500 rounded-full blur-md animate-blast-core"></div>
           <div className="absolute w-full h-full flex items-center justify-center animate-blast-flash"><Star className="text-white fill-yellow-200 w-12 h-12" /></div>
        </div>
      ))}
      {particles.map(p => (
         <div key={p.id} className="absolute w-2 h-2 rounded-full pointer-events-none z-20" style={{ left: `${p.x}%`, top: `${p.y}%`, backgroundColor: p.color, opacity: p.life / 30, transform: `scale(${p.life / 20})` }}></div>
      ))}
    </>
  );
});

const RewardNotification = memo(({ reward }) => {
  if (!reward.active) return null;
  let icon = null; let color = "";
  if (reward.type === 1) { icon = <Rocket size={48} className="text-yellow-400" />; color = "text-yellow-400"; }
  else if (reward.type === 2) { icon = <ChevronsUp size={48} className="text-cyan-400" />; color = "text-cyan-400"; }
  else if (reward.type === 3) { icon = <Zap size={48} className="text-purple-500" />; color = "text-purple-500"; }
  else if (reward.type === 4) { icon = <Flashlight size={48} className="text-green-400" />; color = "text-green-400"; }
  return ( <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center animate-bounce-in pointer-events-none"> <div className="bg-black/70 p-4 rounded-full border-2 border-white/50 backdrop-blur-md shadow-[0_0_30px_rgba(255,255,255,0.5)]">{icon}</div> <div className={`text-4xl font-black mt-2 ${color} drop-shadow-lg stroke-black tracking-widest`} style={{ textShadow: '2px 2px 0 #000' }}>{reward.text}</div> </div> );
});

const HUD = memo(({ playerData, gameStats, nextTarget, isPaused, isKeyboardOpen, displayMode }) => {
    if (isKeyboardOpen) return null;
    const hpPercent = Math.max(0, Math.min(100, (gameStats.hp / (gameStats.maxHp || 100)) * 100));

    let targetText = "";
    if (nextTarget) {
        if (playerData.system === 'poj') {
            targetText = (playerData.accent === 'haikou') ? nextTarget.haikouPoj : nextTarget.generalPoj;
        } else {
            targetText = (playerData.accent === 'haikou') ? nextTarget.haikouTailo : nextTarget.generalTailo;
        }
    }

    return (
        <div className="w-full p-3 bg-gradient-to-b from-black/80 to-transparent z-40 shrink-0 flex justify-between items-start">
            <div className="flex flex-col gap-1">
               <div className="flex items-center gap-2 text-white font-bold text-sm md:text-base bg-blue-900/40 px-3 py-1 rounded-full border border-blue-500/30"><User size={14} className="text-blue-300" />{playerData.name || 'Rookie'}</div>
               <div className="w-32 md:w-40 h-3 bg-gray-800 rounded-full border border-gray-600 overflow-hidden relative mt-1"><div className={`h-full transition-all duration-300 ${hpPercent > 50 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${hpPercent}%` }} /></div>
            </div>
            {nextTarget && (
              <div className="absolute left-1/2 transform -translate-x-1/2 top-3 hidden md:flex flex-col items-center bg-black/60 border border-yellow-500/30 px-4 py-1 rounded-lg backdrop-blur-sm">
                  <div className="text-[10px] text-yellow-500 uppercase tracking-widest mb-0.5 flex items-center gap-1"><Radar size={10} className="animate-pulse" /> Incoming</div>
                  <div className="text-lg md:text-xl font-black text-white leading-none">{nextTarget.hanzi}</div>
                  {displayMode === 'hint' && <div className="text-[10px] text-gray-400 font-mono">{targetText}</div>}
              </div>
            )}
            <div className="flex flex-col items-end gap-2">
                <div className="flex flex-col items-end">
                  <div className="flex items-end gap-3 mb-1">
                      <div className="text-2xl md:text-3xl font-mono text-yellow-400 font-bold tracking-widest drop-shadow-md">{gameStats.score.toString().padStart(6, '0')}</div>
                      <div className="text-sm text-gray-400 font-mono flex items-center gap-1 pb-1" title="擊落數"><Sword size={14} className="text-blue-400" />{gameStats.destroyedCount}</div>
                  </div>
                  {gameStats.streak > 1 && <div className="flex items-center gap-1 text-orange-400 animate-pulse font-bold italic"><Flame size={16} /> COMBO x{gameStats.streak}</div>}
                   <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Gift size={10} /> Next Ultimate: {gameStats.totalCorrect % 20}/20</div>
                </div>
            </div>
            {nextTarget && (
              <div className="flex md:hidden absolute top-16 left-0 w-full justify-center items-center gap-2 text-sm bg-black/30 py-1 pointer-events-none">
                  <Radar size={14} className="text-blue-400 animate-spin-slow" />
                  <span className="text-white font-bold">{nextTarget.hanzi}</span>
                  {displayMode === 'hint' && <span className="text-gray-400 text-xs font-mono">{targetText}</span>}
              </div>
            )}
        </div>
    );
});

const ControlDeck = memo(({ inputValue, isInputError, isPaused, isKeyboardOpen, bombs, onInputChange, onKeyDown, onFocus, onBlur, onCompositionStart, onCompositionEnd, useBomb, score, displayMode }) => {
    return (
        <div className={`absolute bottom-0 left-0 w-full flex flex-col items-center z-50 transition-all duration-300 ${isKeyboardOpen ? 'pb-2' : 'pb-8'}`}>
             <div className={`flex gap-3 justify-center items-center pointer-events-auto transition-all duration-300 ${isKeyboardOpen ? 'mb-1 scale-90' : 'mb-2'}`}>
                  <div className="mr-2"><Spaceship score={score} inputValue={inputValue} compact={isKeyboardOpen} inline={true} /></div>
                  <button onMouseDown={(e) => { e.preventDefault(); useBomb(1); }} disabled={bombs.type1 === 0 || isPaused} className={`w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center relative active:scale-95 transition-all ${bombs.type1 > 0 ? 'bg-gray-800 text-yellow-400 border-yellow-500/50' : 'bg-gray-900 text-gray-600'}`}><Rocket size={18} /><span className="absolute -top-1 -right-1 bg-yellow-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-black">{bombs.type1}</span></button>
                  <button onMouseDown={(e) => { e.preventDefault(); useBomb(2); }} disabled={bombs.type2 === 0 || isPaused} className={`w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center relative active:scale-95 transition-all ${bombs.type2 > 0 ? 'bg-gray-800 text-cyan-400 border-cyan-500/50' : 'bg-gray-900 text-gray-600'}`}><ChevronsUp size={18} /><span className="absolute -top-1 -right-1 bg-cyan-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-black">{bombs.type2}</span></button>
                  <button onMouseDown={(e) => { e.preventDefault(); useBomb(3); }} disabled={bombs.type3 === 0 || isPaused} className={`w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center relative active:scale-95 transition-all ${bombs.type3 > 0 ? 'bg-gray-800 text-purple-400 border-purple-500/50' : 'bg-gray-900 text-gray-600'}`}><Zap size={18} /><span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-black">{bombs.type3}</span></button>
                  {displayMode === 'hidden' && (
                    <button onMouseDown={(e) => { e.preventDefault(); useBomb(4); }} disabled={bombs.type4 === 0 || isPaused} className={`w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center relative active:scale-95 transition-all ${bombs.type4 > 0 ? 'bg-gray-800 text-green-400 border-green-500/50' : 'bg-gray-900 text-gray-600'}`}><Flashlight size={18} /><span className="absolute -top-1 -right-1 bg-green-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-black">{bombs.type4}</span></button>
                  )}
             </div>
             <div className="w-full max-w-sm px-4 pointer-events-auto">
                <input type="text" value={inputValue} onChange={onInputChange} onKeyDown={onKeyDown} onFocus={onFocus} onBlur={onBlur} onCompositionStart={onCompositionStart} onCompositionEnd={onCompositionEnd} placeholder={isPaused ? "PAUSED" : isKeyboardOpen ? "輸入..." : "Type here... (e.g. tai5)"} disabled={isPaused} className={`w-full bg-black/70 border-2 text-white font-mono rounded-full focus:outline-none text-center lowercase transition-all duration-200 ${isInputError ? 'border-red-500 bg-red-900/20 animate-shake' : 'border-blue-500/80 focus:border-yellow-400'} ${isKeyboardOpen ? 'py-1 text-base' : 'py-3 text-xl px-4'} `} autoComplete="off" />
             </div>
        </div>
    );
});

const DesktopCommandCenter = memo(({ gameStats, playerData, nextTarget, isMuted, isPaused, toggleMute, togglePause, displayMode }) => {
    
    // Determine target text
    let targetText = "";
    if (nextTarget) {
        if (playerData.system === 'poj') {
            targetText = (playerData.accent === 'haikou') ? nextTarget.haikouPoj : nextTarget.generalPoj;
        } else {
            targetText = (playerData.accent === 'haikou') ? nextTarget.haikouTailo : nextTarget.generalTailo;
        }
    }

    return (
        <div className="hidden md:flex shrink-0 bg-gray-900 border-l border-gray-700 flex-col shadow-2xl z-20 w-72 order-2">
            <div className="flex items-center justify-center p-4 border-b border-gray-800 bg-black/20"><h3 className="text-yellow-500 font-bold tracking-widest text-lg">COMMAND CENTER</h3></div>
            <div className="flex flex-col h-full p-4 gap-6">
            <div className="flex flex-col gap-6 bg-gray-800/30 p-6 rounded-xl border border-gray-700/50">
                {nextTarget && (
                    <div className="flex flex-col items-center border border-blue-500/30 bg-black/60 p-4 rounded-lg w-full shadow-lg">
                        <div className="flex items-center gap-2 text-xs text-blue-400 mb-2 uppercase tracking-widest"><Radar size={14} className="animate-spin-slow" /> Incoming Target</div>
                        <div className="text-3xl font-black text-white mb-1">{nextTarget.hanzi}</div>
                        {displayMode === 'hint' && <div className="text-sm text-gray-400 font-mono bg-gray-900/80 px-2 py-0.5 rounded">{targetText}</div>}
                    </div>
                )}
                <div className="flex flex-col justify-center text-center">
                    <div className="text-xs text-yellow-500/80 uppercase tracking-wider mb-1">Current Score</div>
                    <div className="text-4xl font-mono text-yellow-400 font-bold drop-shadow-lg">{gameStats.score.toString().padStart(6, '0')}</div>
                    <div className="flex justify-center items-center gap-2 mt-2 text-gray-400 text-sm font-mono"><Sword size={16} className="text-blue-400"/> {gameStats.destroyedCount} Targets Down</div>
                    {gameStats.streak > 1 && <div className="text-orange-400 font-bold italic animate-pulse mt-2">COMBO x{gameStats.streak}</div>}
                    <div className="mt-6 flex justify-between items-end mb-1"><span className="text-xs text-gray-400 uppercase">Shield</span><span className={`text-xs font-bold ${gameStats.hp > (gameStats.maxHp || 100) * 0.3 ? 'text-blue-400' : 'text-red-500'}`}>{Math.floor((gameStats.hp / (gameStats.maxHp || 100)) * 100)}%</span></div>
                    <div className="h-2 bg-black rounded-full overflow-hidden border border-gray-700 relative"><div className={`h-full transition-all duration-300 ${gameStats.hp > (gameStats.maxHp || 100) * 0.5 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${(gameStats.hp / (gameStats.maxHp || 100)) * 100}%` }} /></div>
                </div>
            </div>
            <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300"><User size={20} /></div>
                <div><div className="text-[10px] text-gray-500 uppercase">Pilot</div><div className="text-white font-bold">{playerData.name}</div></div>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-3">
                <button onClick={toggleMute} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 text-blue-300 flex items-center justify-center gap-2 transition-colors">{isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />} <span className="text-xs uppercase">Sound</span></button>
                <button onClick={togglePause} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 text-yellow-400 flex items-center justify-center gap-2 transition-colors">{isPaused ? <Play size={20} /> : <Pause size={20} />} <span className="text-xs uppercase">{isPaused ? "Resume" : "Pause"}</span></button>
            </div>
            </div>
        </div>
    );
});

const IntroScreen = memo(({ onStart, onShowLeaderboard }) => (
  <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-fade-in relative z-10">
    <VisitCounter />
    <h1 className="text-6xl md:text-8xl font-black text-yellow-400 tracking-widest" style={{ textShadow: '0 0 20px #FFD700' }}>必殺!<br/>Tâi-Lô</h1>
    <p className="text-blue-300 text-xl tracking-widest uppercase">The Force of FomoLingo</p>
    <div className="flex gap-4 mt-8">
        <button onClick={onStart} className="px-12 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-2xl rounded-full transition-all transform hover:scale-110 shadow-lg shadow-yellow-500/50 flex items-center gap-2"><Play fill="black" /> START GAME</button>
        <button onClick={onShowLeaderboard} className="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl rounded-full transition-all hover:scale-105 shadow-lg flex items-center gap-2"><Trophy size={24} /> 英雄榜</button>
    </div>
    <div className="mt-8 text-sm md:text-base text-gray-500 font-mono tracking-wider opacity-80 hover:text-yellow-500/80 transition-colors">Crafted with care by @Khiohtaigu</div>
  </div>
));

const NameScreen = memo(({ name, setName, onSubmit, isComposing, setIsComposing }) => {
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
        setError('請輸入名稱');
        return;
    }
    if (name.length > 12) {
        setError('名稱太長了 (最多12字)');
        return;
    }
    if (checkProfanity(name)) {
        setError('⚠️ 名稱包含不雅文字或諧音，請保持文明');
        return;
    }
    setError('');
    onSubmit(e);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto w-full px-4 relative z-10">
      <div className={`border-2 ${error ? 'border-red-500 animate-shake' : 'border-yellow-500/50'} bg-black/80 p-8 rounded-xl w-full backdrop-blur-sm shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-colors`}>
        <h2 className="text-3xl text-yellow-400 mb-6 font-bold text-center">輸入英雄名稱</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <User className={`absolute left-3 top-3 ${error ? 'text-red-400' : 'text-gray-400'}`} />
            <input 
                type="text" 
                value={name} 
                onChange={(e) => { setName(e.target.value); setError(''); }} 
                onCompositionStart={() => setIsComposing(true)} 
                onCompositionEnd={() => setIsComposing(false)} 
                placeholder="名稱 (支援中/日/韓/英...)" 
                className={`w-full bg-gray-900 border ${error ? 'border-red-500 text-red-100' : 'border-gray-700 text-white'} px-10 py-3 rounded focus:outline-none focus:ring-1 ${error ? 'focus:border-red-500 focus:ring-red-500' : 'focus:border-yellow-500 focus:ring-yellow-500'} transition-colors`} 
                autoFocus 
            />
          </div>
          {error && <div className="text-red-400 text-sm font-bold text-center animate-pulse">{error}</div>}
          <button type="submit" className={`w-full ${error ? 'bg-red-900 hover:bg-red-800' : 'bg-blue-600 hover:bg-blue-500'} text-white py-3 rounded font-bold tracking-wide transition-colors`}>
              {error ? '請修正名稱' : '確認 (ENTER)'}
          </button>
        </form>
      </div>
    </div>
  );
});

const ModeScreen = memo(({ onSelect }) => (
  <div className="flex flex-col items-center justify-center h-full w-full px-4 relative z-10">
    <h2 className="text-4xl text-yellow-400 mb-12 font-bold tracking-wider">選擇遊戲模式</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
      <button onClick={onSelect} className="group relative border border-blue-500/30 bg-gray-900/80 p-8 rounded-xl hover:bg-blue-900/20 transition-all hover:border-blue-400"><div className="flex flex-col items-center space-y-4"><User size={64} className="text-blue-400 group-hover:text-blue-200" /><h3 className="text-2xl text-white font-bold">單機遊戲</h3><p className="text-gray-400 text-sm">Single Player Mode</p></div></button>
      <button className="group relative border border-red-500/30 bg-gray-900/80 p-8 rounded-xl opacity-70 cursor-not-allowed" title="需連接後端伺服器 (目前僅展示UI)"><div className="absolute top-2 right-2 bg-red-900 text-red-200 text-xs px-2 py-1 rounded">Coming Soon</div><div className="flex flex-col items-center space-y-4"><Globe size={64} className="text-red-400" /><h3 className="text-2xl text-white font-bold">網路連線</h3><p className="text-gray-400 text-sm">Multiplayer (Co-op / PvP)</p></div></button>
    </div>
  </div>
));

const SystemScreen = memo(({ onSelect }) => (
  <div className="flex flex-col items-center justify-center h-full w-full px-4 relative z-10">
    <h2 className="text-4xl text-yellow-400 mb-12 font-bold tracking-wider text-center">選擇拼音系統</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
      <button onClick={() => onSelect('tailo')} className="group relative border border-green-500/30 bg-gray-900/80 p-8 rounded-xl hover:bg-green-900/20 transition-all hover:border-green-400 hover:scale-105">
        <div className="flex flex-col items-center space-y-4"><BookOpen size={64} className="text-green-400 group-hover:text-green-200" /><h3 className="text-2xl text-white font-bold">教育部臺羅拼音</h3><p className="text-gray-400 text-sm">Tâi-uân Lô-má-jī (Tailo)</p><p className="text-green-300/60 text-xs font-mono">例: tsheh (冊)</p></div>
      </button>
      <button onClick={() => onSelect('poj')} className="group relative border border-purple-500/30 bg-gray-900/80 p-8 rounded-xl hover:bg-purple-900/20 transition-all hover:border-purple-400 hover:scale-105">
        <div className="flex flex-col items-center space-y-4"><BookOpen size={64} className="text-purple-400 group-hover:text-purple-200" /><h3 className="text-2xl text-white font-bold">白話字</h3><p className="text-gray-400 text-sm">Pe̍h-ōe-jī (POJ)</p><p className="text-purple-300/60 text-xs font-mono">例: chheh (冊)</p></div>
      </button>
    </div>
  </div>
));

// 新增 AccentScreen: 選擇腔調 (通行腔 vs 海口腔)
const AccentScreen = memo(({ onSelect }) => (
    <div className="flex flex-col items-center justify-center h-full w-full px-4 relative z-10">
      <h2 className="text-4xl text-yellow-400 mb-12 font-bold tracking-wider text-center">選擇發音腔調</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Haikou Accent (Moved to Left) */}
        <button onClick={() => onSelect('haikou')} className="group relative border border-orange-500/30 bg-gray-900/80 p-8 rounded-xl hover:bg-orange-900/20 transition-all hover:border-orange-400 hover:scale-105">
          <div className="flex flex-col items-center space-y-4"><Mic size={64} className="text-orange-400 group-hover:text-orange-200" /><h3 className="text-2xl text-white font-bold">海口腔 (Hái-kháu)</h3><p className="text-gray-400 text-sm">包含泉州、鹿港等地特色發音 (e.g. 豬 tu -> tir)</p></div>
        </button>
        {/* General Accent (Moved to Right) */}
        <button onClick={() => onSelect('general')} className="group relative border border-cyan-500/30 bg-gray-900/80 p-8 rounded-xl hover:bg-cyan-900/20 transition-all hover:border-cyan-400 hover:scale-105">
          <div className="flex flex-col items-center space-y-4"><Mic size={64} className="text-cyan-400 group-hover:text-cyan-200" /><h3 className="text-2xl text-white font-bold">通行腔 (General)</h3><p className="text-gray-400 text-sm">臺灣最通行的發音</p></div>
        </button>
      </div>
    </div>
  ));

const TutorialScreen = memo(({ onNext }) => (
  <div className="flex flex-col items-center justify-center h-full w-full px-4 relative z-10 max-w-4xl mx-auto">
    <h2 className="text-4xl text-yellow-400 mb-8 font-bold tracking-wider text-center">任務說明 (Mission Briefing)</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
        <div className="bg-gray-900/80 p-6 rounded-xl border border-blue-500/30">
            <h3 className="text-xl text-blue-400 font-bold mb-4 flex items-center gap-2"><User /> 基礎訓練</h3>
            <ul className="space-y-3 text-gray-300 text-sm md:text-base">
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div><span>使用鍵盤輸入掉落漢字的拼音 (支援數字聲調)。</span></li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div><span>輸入正確後按下 <code className="bg-gray-800 px-1 rounded text-white">Enter</code> 發射子彈。</span></li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div><span>答對越多，連擊數 (Combo) 越高，可獲得強力道具。</span></li>
            </ul>
        </div>
        <div className="bg-gray-900/80 p-6 rounded-xl border border-yellow-500/30">
            <h3 className="text-xl text-yellow-400 font-bold mb-4 flex items-center gap-2"><Rocket /> 武器庫 (Armory)</h3>
            <div className="space-y-4">
                <div className="flex items-center gap-4"><div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center border border-yellow-500 text-yellow-400"><Rocket size={24} /></div><div><div className="text-white font-bold">導彈 (Missile)</div><div className="text-gray-400 text-xs">連擊 x3 獲得。自動追蹤並摧毀最下方的目標。</div></div></div>
                <div className="flex items-center gap-4"><div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center border border-cyan-500 text-cyan-400"><ChevronsUp size={24} /></div><div><div className="text-white font-bold">雷射光束 (Beam)</div><div className="text-gray-400 text-xs">連續擊落 6 次獲得。一次性摧毀畫面上半數目標。</div></div></div>
                <div className="flex items-center gap-4"><div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center border border-purple-500 text-purple-400"><Zap size={24} /></div><div><div className="text-white font-bold">閃電風暴 (Lightning)</div><div className="text-gray-400 text-xs">擊落總數達 20 次獲得。全畫面攻擊，清除所有威脅。</div></div></div>
                <div className="flex items-center gap-4"><div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center border border-green-500 text-green-400"><Flashlight size={24} /></div><div><div className="text-white font-bold">手電筒 (Flashlight)</div><div className="text-gray-400 text-xs">全漢字模式專用。照亮（顯示拼音）最下方的目標。</div></div></div>
            </div>
        </div>
    </div>
    <button onClick={onNext} className="px-12 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-2xl rounded-full transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/50 flex items-center gap-2"><Play fill="black" /> 準備出擊 (READY)</button>
  </div>
));

const DifficultyScreen = memo(({ onSelect }) => (
  <div className="flex flex-col items-center justify-center h-full w-full px-4 relative z-10">
    <h2 className="text-4xl text-yellow-400 mb-12 font-bold tracking-wider">選擇難度</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
      {[{ id: 'A', label: '簡單 (Easy)', color: 'text-green-400', border: 'border-green-500', desc: '適合初學者，速度慢' }, { id: 'B', label: '普通 (Normal)', color: 'text-yellow-400', border: 'border-yellow-500', desc: '標準速度，挑戰開始' }, { id: 'C', label: '困難 (Hard)', color: 'text-red-500', border: 'border-red-500', desc: '絕地武士等級，極速' }].map((diff) => (
        <button key={diff.id} onClick={() => onSelect(diff.id)} className={`flex flex-col items-center justify-center p-8 border-2 ${diff.border} bg-black/60 hover:bg-gray-800 rounded-xl transition-transform hover:scale-105`}><h3 className={`text-3xl font-bold ${diff.color} mb-2`}>{diff.id}</h3><h4 className="text-xl text-white mb-4">{diff.label}</h4><p className="text-gray-400 text-sm">{diff.desc}</p></button>
      ))}
    </div>
  </div>
));

const RangeScreen = memo(({ onSelect }) => (
    <div className="flex flex-col items-center justify-center h-full w-full px-4 relative z-10">
      <h2 className="text-4xl text-yellow-400 mb-8 font-bold tracking-wider">選擇單字範圍 (七百字)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        {[
          { label: '範圍 1-200 (基礎)', range: [1, 200], icon: <Layers size={24}/>, color: 'border-blue-500 text-blue-400' },
          { label: '範圍 201-400 (進階)', range: [201, 400], icon: <Target size={24}/>, color: 'border-green-500 text-green-400' },
          { label: '範圍 401-705 (挑戰)', range: [401, 705], icon: <Flame size={24}/>, color: 'border-red-500 text-red-400' },
          { label: '全部範圍 (All)', range: [1, 705], icon: <Globe size={24}/>, color: 'border-white text-white' },
        ].map((item, idx) => (
          <button 
              key={idx} 
              onClick={() => onSelect(item.range)} 
              className={`flex flex-row items-center justify-center gap-4 p-6 border-2 ${item.color} bg-black/60 hover:bg-gray-800 rounded-xl transition-all hover:scale-105 active:scale-95`}
          >
              <div>{item.icon}</div>
              <h3 className="text-xl font-bold">{item.label}</h3>
          </button>
        ))}
      </div>
    </div>
));

const DisplayModeScreen = memo(({ onSelect }) => (
  <div className="flex flex-col items-center justify-center h-full w-full px-4 relative z-10">
    <h2 className="text-4xl text-yellow-400 mb-12 font-bold tracking-wider">選擇顯示模式</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
      <button onClick={() => onSelect('hint')} className="group relative border border-cyan-500/30 bg-gray-900/80 p-8 rounded-xl hover:bg-cyan-900/20 transition-all hover:border-cyan-400 hover:scale-105">
        <div className="flex flex-col items-center space-y-4"><Eye size={64} className="text-cyan-400 group-hover:text-cyan-200" /><h3 className="text-2xl text-white font-bold">拼音輔助 (Hint)</h3><p className="text-gray-400 text-sm">顯示羅馬拼音提示 (依據選擇的腔調)</p></div>
      </button>
      <button onClick={() => onSelect('hidden')} className="group relative border border-red-500/30 bg-gray-900/80 p-8 rounded-xl hover:bg-red-900/20 transition-all hover:border-red-400 hover:scale-105">
        <div className="flex flex-col items-center space-y-4"><EyeOff size={64} className="text-red-400 group-hover:text-red-200" /><h3 className="text-2xl text-white font-bold">全漢字 (Master)</h3><p className="text-gray-400 text-sm">隱藏提示，挑戰極限</p></div>
      </button>
    </div>
  </div>
));

const GameOverScreen = memo(({ score, destroyedCount, name, geminiAnalysis, onAnalyze, isAnalyzing, mistakes, revealedWords, onRestart, difficulty, playerData }) => {
  const rank = getPlayerRank(score);
  const combinedList = [...new Map([...mistakes, ...revealedWords].map(item => [item.id, item])).values()];
  const hasUploaded = useRef(false);
  const hasAnalyzed = useRef(false);
  const [activeTab, setActiveTab] = useState('analysis');
  const [playerRank, setPlayerRank] = useState(null);

  // 自動上傳成績 & 計算即時排名
  useEffect(() => {
    if (score > 0 && name && !hasUploaded.current) {
        hasUploaded.current = true;
        
        const processScore = async () => {
            try {
                // 1. 上傳分數
                await addDoc(collection(db, "leaderboard"), {
                    name: name,
                    score: score,
                    difficulty: difficulty, 
                    timestamp: new Date()
                });

                // 2. 計算排名 (比這個分數高的人數 + 1)
                const rankQuery = query(
                    collection(db, "leaderboard"),
                    where("difficulty", "==", difficulty),
                    where("score", ">", score)
                );
                const snapshot = await getCountFromServer(rankQuery);
                const rankCount = snapshot.data().count + 1; // +1 因為自己是下一名
                setPlayerRank(rankCount);

            } catch (e) {
                console.error("Error processing score: ", e);
            }
        };
        processScore();
    }
  }, [score, name, difficulty]);

  // 自動呼叫 AI 分析 (只執行一次)
  useEffect(() => {
    if (!hasAnalyzed.current) {
        onAnalyze(score, mistakes);
        hasAnalyzed.current = true;
    }
  }, [score, mistakes, onAnalyze]);

  const renderContent = () => {
    switch (activeTab) {
      case 'leaderboard':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
             <LeaderboardScreen defaultDifficulty={difficulty} />
          </div>
        );
      case 'review':
        return (
          <div className="w-full h-full flex flex-col p-4">
              <h2 className="text-3xl font-bold text-red-500 flex items-center justify-center gap-2 mb-4"><AlertTriangle /> 戰鬥檢討 (Mistakes)</h2>
              {combinedList.length > 0 ? (
                <div className="w-full bg-gray-900/90 rounded-lg border border-red-500/30 flex flex-col flex-1 overflow-hidden">
                    <div className="overflow-y-auto p-4 custom-scrollbar">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="text-xs uppercase text-gray-500 border-b border-gray-700 sticky top-0 bg-gray-900">
                                <tr>
                                    <th className="pb-3 pl-2">漢字</th>
                                    <th className="pb-3">臺羅 (海口腔優先)</th>
                                    <th className="pb-3">白話字</th>
                                </tr>
                            </thead>
                            <tbody>
                                {combinedList.map((word) => {
                                    const displayT = playerData.accent === 'haikou' ? word.haikouTailo : word.generalTailo;
                                    const displayP = playerData.accent === 'haikou' ? word.haikouPoj : word.generalPoj;
                                    return (
                                        <tr key={word.id} className="border-b border-gray-800 hover:bg-white/5">
                                            <td className="py-3 pl-2 text-white font-bold text-xl">{word.hanzi}</td>
                                            <td className="py-3 font-mono text-blue-300">{displayT}</td>
                                            <td className="py-3 font-mono text-purple-300">{displayP}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                    <Star size={48} className="text-yellow-500 mb-4" />
                    <p className="text-xl">完美達成！無失誤紀錄。</p>
                </div>
            )}
          </div>
        );
      case 'analysis':
      default:
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center space-y-4">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Medal size={80} className="text-yellow-500" /></div>
                
                <div className="bg-gray-900/90 p-4 rounded-2xl border border-gray-700 w-full max-w-2xl relative shadow-2xl">
                    <div className="flex flex-col items-center mb-4">
                        <h3 className="text-xl text-gray-300 mb-1 font-mono tracking-widest">PILOT: <span className="text-white font-bold text-2xl ml-2">{name}</span></h3>
                        <div className={`flex items-center gap-2 text-xl font-bold ${rank.color} bg-black/40 px-4 py-1 rounded-full border border-gray-700 mt-1`}>
                            {rank.icon}<span>{rank.title}</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4 w-full">
                         <div className="flex flex-col items-center bg-black/30 py-2 rounded-xl border border-gray-800">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total Score</span>
                            <span className="text-2xl text-yellow-400 font-mono font-bold">{score}</span>
                         </div>
                         <div className="flex flex-col items-center bg-black/30 py-2 rounded-xl border border-gray-800">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Targets Down</span>
                            <span className="text-2xl text-blue-400 font-mono font-bold">{destroyedCount}</span>
                         </div>
                         <div className="flex flex-col items-center bg-black/30 py-2 rounded-xl border border-gray-800 relative overflow-hidden">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Global Rank</span>
                            <span className="text-2xl text-green-400 font-mono font-bold flex items-center gap-1">
                                {playerRank ? `#${playerRank}` : <span className="animate-pulse">...</span>}
                            </span>
                            {playerRank && playerRank <= 20 && <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>}
                         </div>
                    </div>

                    <div className="text-left bg-black/60 p-4 rounded-xl border border-blue-500/30">
                        <div className="flex items-center gap-2 text-blue-400 mb-2 border-b border-gray-800 pb-1">
                            <Sparkles size={16} />
                            <span className="font-bold uppercase tracking-widest text-xs">Jedi Master Analysis</span>
                        </div>
                        <div className="text-gray-300 text-base leading-relaxed font-sans min-h-[3rem] flex items-center">
                            {isAnalyzing ? (
                                <div className="flex items-center gap-2 animate-pulse text-yellow-500">
                                    <MessageSquare size={16} /><span>大師正在冥想中……</span>
                                </div>
                            ) : (
                                <p>{geminiAnalysis}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative z-10 bg-black/90 overflow-hidden">
      
      {/* 頂部標題與 Tab */}
      <div className="w-full flex flex-col items-center pt-4 pb-2 bg-gradient-to-b from-gray-900 to-transparent z-20 shrink-0">
          <h2 className="text-4xl md:text-5xl font-black text-red-600 mb-4 tracking-widest" style={{ textShadow: '0 0 15px rgba(220,38,38,0.6)' }}>MISSION FAILED</h2>
          
          <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-1 rounded-full font-bold transition-all flex items-center gap-2 text-sm ${activeTab === 'analysis' ? 'bg-yellow-500 text-black shadow-[0_0_10px_#EAB308]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                  <User size={16} /> 評價
              </button>
              <button 
                onClick={() => setActiveTab('leaderboard')}
                className={`px-4 py-1 rounded-full font-bold transition-all flex items-center gap-2 text-sm ${activeTab === 'leaderboard' ? 'bg-yellow-500 text-black shadow-[0_0_10px_#EAB308]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                  <Trophy size={16} /> 英雄榜
              </button>
              <button 
                onClick={() => setActiveTab('review')}
                className={`px-4 py-1 rounded-full font-bold transition-all flex items-center gap-2 text-sm ${activeTab === 'review' ? 'bg-yellow-500 text-black shadow-[0_0_10px_#EAB308]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                  <AlertTriangle size={16} /> 檢討
              </button>
          </div>
      </div>

      {/* 主要內容區 (彈性伸縮，內容過多時內部卷軸) */}
      <div className="flex-1 w-full relative min-h-0 flex flex-col p-2">
          {renderContent()}
      </div>

      {/* 底部固定按鈕 */}
      <div className="w-full p-4 flex justify-center bg-gradient-to-t from-black to-transparent shrink-0 z-20">
          <button 
            onClick={onRestart} 
            className="px-8 py-3 bg-white hover:bg-gray-200 text-black text-lg font-black rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all transform hover:scale-105 flex items-center gap-3"
          >
              <RotateCcw size={20} /> RETURN TO BASE
          </button>
      </div>
    </div>
  );
});

// --- 主應用組件 ---
export default function App() {
  const [screen, setScreen] = useState('intro'); 
  const [playerData, setPlayerData] = useState({ name: '', mode: '', difficulty: '', system: 'tailo', accent: 'general' });
  const [gameStats, setGameStats] = useState({ score: 0, hp: 100, maxHp: 100, destroyedCount: 0, streak: 0, totalCorrect: 0, roundsCompleted: 0 }); 
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedRange, setSelectedRange] = useState([1, 200]); 
  const [displayMode, setDisplayMode] = useState('hint'); 

  // 新增：粒子特效狀態
  const [gameEntities, setGameEntities] = useState({ words: [], projectiles: [], explosions: [], particles: [] });
  const [nextTarget, setNextTarget] = useState(null);
  const wordDeckRef = useRef([]);
  // 避免重複計算擊殺的 Ref
  const processedKillIds = useRef(new Set());

  const [inputValue, setInputValue] = useState('');
  const [isInputError, setIsInputError] = useState(false);
  // type4 is Flashlight
  const [bombs, setBombs] = useState({ type1: 3, type2: 2, type3: 1, type4: 3 });
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [rewardFlash, setRewardFlash] = useState({ active: false, type: 0, text: "" });
  const [waveMessage, setWaveMessage] = useState(null);
  const [isWavePaused, setIsWavePaused] = useState(false);
  
  const [revealedWords, setRevealedWords] = useState([]); 

  // ==========================================
  //  GEMINI AI 設定與功能實作
  // ==========================================
  
  // 1. 請將你的 API Key 貼在下方引號中
  const apiKey = "AIzaSyDeT8iCZVWOol8riIAlb-b0FFgHJ0pf_o8"; 

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [geminiAnalysis, setGeminiAnalysis] = useState('');
  const [mistakes, setMistakes] = useState([]);

  // 2. 真實的 AI 分析函式 (包含 Safety Settings 修正)
  const callGeminiAnalysis = useCallback(async (finalScore, playerMistakes) => {
    setIsAnalyzing(true);

    if (!apiKey || apiKey.includes("這裡貼上")) {
        setGeminiAnalysis("大師正在冥想中……");
        setIsAnalyzing(false);
        return;
    }

    try {
        const mistakesSummary = playerMistakes.length > 0 
            ? playerMistakes.slice(0, 8).map(w => `${w.hanzi} (${playerData.system === 'poj' ? w.poj : w.tailo})`).join(', ')
            : "無 (完美表現)";

        const rank = getPlayerRank(finalScore);
        const systemName = playerData.system === 'poj' ? "白話字 (POJ)" : "臺羅拼音 (Tailo)";
        const accentName = playerData.accent === 'haikou' ? "海口腔" : "通行腔";

        const prompt = `
            你現在是一位講台語的絕地武士大師（類似尤達 Yoda 或歐比王）。
            有一位學徒剛完成了「台語拼音防禦訓練」。
            
            [訓練數據]
            - 拼音系統: ${systemName}
            - 選擇腔調: ${accentName}
            - 最終分數: ${finalScore}
            - 獲得稱號: ${rank.title}
            - 錯誤詞彙: ${mistakesSummary}
            
            [你的任務]
            請用「繁體中文」給予這位學徒一段簡短的評語（80字以內）。
            
            [風格要求]
            1. 語氣要有智慧、沉穩，或是像尤達那樣倒裝。
            2. 必須包含一句台語（用漢字或羅馬拼音皆可）來鼓勵他。
            3. 針對他的錯誤詞彙（如果有的話）給予一點具體的拼音建議。
            4. 如果分數很高，稱讚他的原力很強；如果分數低，鼓勵他多練習。
        `;

        // 嘗試列表：優先嘗試 gemini-2.5-flash (最快)，失敗則嘗試 gemini-2.5-pro，失敗則嘗試 gemini-2.5-flash-001，最後 gemini-pro (fallback)
        const modelCandidates = ["gemini-2.5-flash", "gemini-2.5-flash-001", "gemini-2.5-pro", "gemini-pro"];
        
        for (const model of modelCandidates) {
            try {
                // Remove trailing whitespace from API key just in case
                const safeKey = apiKey.trim();
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${safeKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        safetySettings: [
                            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                        ]
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    console.warn(`Model ${model} failed with status ${response.status}`, errData);
                    
                    // 如果所有嘗試都失敗了且是最後一個模型，拋出最後的錯誤訊息給畫面
                    if (model === modelCandidates[modelCandidates.length - 1]) {
                        throw new Error(`${response.status} ${errData.error?.message || response.statusText}`);
                    }
                    continue; // 嘗試下一個模型
                }

                const data = await response.json();
                if (data.candidates && data.candidates[0].content) {
                    setGeminiAnalysis(data.candidates[0].content.parts[0].text);
                    setIsAnalyzing(false);
                    return; // 成功就結束
                }
            } catch (e) {
                console.error(`Error with model ${model}:`, e);
                // 如果是最後一次嘗試也失敗，更新狀態
                if (model === modelCandidates[modelCandidates.length - 1]) {
                   // 不再顯示詳細錯誤代碼，只顯示冥想中
                   setGeminiAnalysis("大師正在冥想中……");
                }
            }
        }
    } catch (error) {
        console.error("Gemini API Connection Error:", error);
        // 不再顯示詳細錯誤代碼
        setGeminiAnalysis("大師正在冥想中……");
    } finally {
        setIsAnalyzing(false);
    }
  }, [apiKey, playerData.system, playerData.accent]);

  // Handle flow logic with new Accent Screen
  const handleSystemSelect = (system) => { setPlayerData(prev => ({ ...prev, system })); setScreen('accent'); };
  const handleAccentSelect = (accent) => { setPlayerData(prev => ({ ...prev, accent })); setScreen('tutorial'); };
  const handleTutorialComplete = () => { setScreen('difficulty'); };

  // ... (其余部分維持與前一版邏輯一致)

  const gameLoopRef = useRef(null);
  const audioRef = useRef(null);
  const gameAreaRef = useRef(null); 
  const lastTimeRef = useRef(0); 
  const entitiesRef = useRef(gameEntities);

  useEffect(() => { entitiesRef.current = gameEntities; }, [gameEntities]);

  // 音效系統
  const playSound = useCallback((type) => {
    if (isMuted) return;
    const sounds = {
        'shoot': '/bullet.mp3', 
        'missile': '/missile.mp3',
        'beam': '/laser.mp3',   
        'lightning': '/thunder.mp3', 
        'flashlight': 'https://commondatastorage.googleapis.com/codeskulptor-assets/week7-button.m4a',
        'boom': 'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/explosion_01.mp3'
    };
    if (sounds[type]) {
        const audio = new Audio(sounds[type]);
        audio.volume = 1.0;
        audio.play().catch(e => {}); 
    }
  }, [isMuted]);

  useEffect(() => { 
      if (audioRef.current) { 
          audioRef.current.volume = 0.2;
          if (isMuted) audioRef.current.pause(); 
          else audioRef.current.play().catch(error => {}); 
      } 
  }, [isMuted, screen]);

  const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);
  const togglePause = useCallback(() => { if (screen === 'game') setIsPaused(prev => !prev); }, [screen]);
  const handleCompositionStart = useCallback(() => setIsComposing(true), []);
  const handleCompositionEnd = useCallback(() => setIsComposing(false), []);

  const handleNameSubmit = (e) => { e.preventDefault(); if (playerData.name.trim()) { setScreen('mode'); if (audioRef.current && !isMuted) audioRef.current.play().catch(() => {}); } };
  const handleDifficultySelect = (difficulty) => { setPlayerData(prev => ({ ...prev, difficulty })); setScreen('range'); };
  const handleRangeSelect = (range) => { setSelectedRange(range); setScreen('display'); };
  const handleShowLeaderboard = () => setScreen('leaderboard');

  useEffect(() => {
      const count = gameStats.destroyedCount;
      const waveThresholds = [20, 50, 80, 100, 150, 200, 300, 500];
      if (count > 0 && waveThresholds.includes(count)) {
          setIsWavePaused(true);
          const waveNum = waveThresholds.indexOf(count) + 2; 
          setGameEntities(prev => ({ ...prev, words: [] }));
          setTimeout(() => {
              setWaveMessage({ text: `第 ${waveNum} 波攻勢即將襲來`, subtext: `WARNING: WAVE ${waveNum} INCOMING` });
              const restTime = count > 50 ? 10000 : 6000;
              setTimeout(() => { setWaveMessage(null); setTimeout(() => { setIsWavePaused(false); }, 2000); }, restTime);
          }, 2000);
      }
  }, [gameStats.destroyedCount]);

  const startGame = useCallback((mode) => {
    setDisplayMode(mode);
    
    // 設定不同難度的初始血量 (每題扣10分)
    // A: 20題 (200HP), B: 10題 (100HP), C: 20題 (200HP)
    let startHp = 100;
    if (playerData.difficulty === 'A' || playerData.difficulty === 'C') {
        startHp = 200;
    }

    setGameStats({ score: 0, hp: startHp, maxHp: startHp, destroyedCount: 0, streak: 0, totalCorrect: 0, roundsCompleted: 0 });
    setGameEntities({ words: [], projectiles: [], explosions: [], particles: [] });
    setBombs({ type1: 3, type2: 2, type3: 1, type4: 3 });
    setMistakes([]);
    setRevealedWords([]);
    setGeminiAnalysis('');
    setRewardFlash({ active: false, type: 0, text: "" });
    setWaveMessage(null);
    setIsWavePaused(false);
    
    // 重置擊殺紀錄
    processedKillIds.current = new Set();
    
    let deck = INITIAL_WORD_DATABASE.filter(word => word.id >= selectedRange[0] && word.id <= selectedRange[1]);
    if (deck.length === 0) deck = [...INITIAL_WORD_DATABASE];

    deck = shuffleArray(deck);
    const firstWord = deck.pop();
    wordDeckRef.current = deck;

    setNextTarget(firstWord);
    setIsPaused(false);
    setScreen('game');
    if (audioRef.current && !isMuted) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); }
  }, [isMuted, selectedRange, playerData.difficulty]);

  const handleRestart = useCallback(() => setScreen('intro'), []);
  const handleInputFocus = () => { setIsKeyboardOpen(true); };
  const handleInputBlur = () => setIsKeyboardOpen(false);

  const getCurrentSpeedConfig = useCallback(() => {
    const settings = { 
        'A': { baseSpeed: 0.02, maxSpeed: 0.04, baseRate: 5000 }, 
        'B': { baseSpeed: 0.05, maxSpeed: 0.09, baseRate: 3500 }, 
        'C': { baseSpeed: 0.10, maxSpeed: 0.10, baseRate: 2000 } 
    };
    const currentSetting = settings[playerData.difficulty] || settings['A'];
    let speed = currentSetting.baseSpeed;
    let rate = currentSetting.baseRate;

    // 只有非困難模式 (A, B) 才會有速度隨時間增加的機制
    // 困難模式 (C) 保持固定速度與頻率
    if (playerData.difficulty !== 'C' && gameStats.destroyedCount > 0) {
        const speedIncrease = gameStats.destroyedCount * 0.002;
        const rateDecrease = gameStats.destroyedCount * 10;
        speed = Math.min(speed + speedIncrease, currentSetting.maxSpeed);
        rate = Math.max(rate - rateDecrease, 800);
    }
    return { speed, rate };
  }, [playerData.difficulty, gameStats.destroyedCount]);

  const spawnWord = useCallback(() => {
    if (isPaused || !nextTarget || isWavePaused) return; 
    const { speed } = getCurrentSpeedConfig();
    const wordData = nextTarget;
    let deck = wordDeckRef.current;
    if (deck.length === 0) {
        setGameStats(prev => ({ ...prev, roundsCompleted: prev.roundsCompleted + 1 }));
        let fullDeck = INITIAL_WORD_DATABASE.filter(word => word.id >= selectedRange[0] && word.id <= selectedRange[1]);
        if (fullDeck.length === 0) fullDeck = [...INITIAL_WORD_DATABASE];
        deck = shuffleArray(fullDeck);
    }
    const newNextWord = deck.pop();
    wordDeckRef.current = deck;
    setNextTarget(newNextWord);
    const id = Date.now() + Math.random();
    setGameEntities(prev => {
      const safeDistance = 15; const activeWordsAtTop = prev.words.filter(w => w.y < 20); 
      let x = 0; let foundSpot = false; let attempts = 0; const maxAttempts = 15; 
      while (!foundSpot && attempts < maxAttempts) { x = 10 + Math.random() * 80; foundSpot = true; for (let w of activeWordsAtTop) { if (Math.abs(w.x - x) < safeDistance) { foundSpot = false; break; } } attempts++; }
      if (!foundSpot) return prev;
      return { ...prev, words: [...prev.words, { ...wordData, id, x, y: -15, speed, isLocked: false, isRevealed: false }] };
    });
  }, [getCurrentSpeedConfig, isPaused, nextTarget, isWavePaused, selectedRange]);

  useEffect(() => {
    if (screen !== 'game') return;
    let timeoutId;
    const scheduleNextSpawn = () => { const { rate } = getCurrentSpeedConfig(); const delay = entitiesRef.current.words.length === 0 ? 800 : rate; timeoutId = setTimeout(() => { if (!isPaused) spawnWord(); }, delay); };
    if (!isPaused) scheduleNextSpawn();
    return () => clearTimeout(timeoutId);
  }, [screen, isPaused, getCurrentSpeedConfig, spawnWord, gameEntities.words.length, isWavePaused]); 

  useEffect(() => {
    if (screen !== 'game') { lastTimeRef.current = 0; return; }
    const loop = (time) => {
      if (!lastTimeRef.current) lastTimeRef.current = time; const deltaTime = time - lastTimeRef.current; lastTimeRef.current = time;
      if (!isPaused) {
        setGameEntities(prev => {
            const nextWords = []; const missedWords = []; let hpDamage = 0;
            prev.words.forEach(word => {
                const nextY = word.y + word.speed * (deltaTime / 16);
                
                // --- 修正邏輯開始 ---
                if (nextY > 105) { 
                    if (word.isLocked) {
                        // 強制停留在底部邊緣，等待被雷射/導彈擊中
                        nextWords.push({ ...word, y: 105 }); 
                    } else {
                        // 真的漏接了 -> 扣血
                        hpDamage += 10; 
                        missedWords.push(word); 
                    }
                } else { 
                    // 正常移動
                    nextWords.push({ ...word, y: nextY }); 
                }
                // --- 修正邏輯結束 ---
            });
            const nextProjs = []; const hitWordIds = new Set();
            prev.projectiles.forEach(p => {
                const target = nextWords.find(w => w.id === p.targetId);
                if (!target) { if (p.y > -10) nextProjs.push({...p, y: p.y - 3}); return; }
                const dx = target.x - p.x; const dy = (target.y + 5) - p.y; const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 3) { hitWordIds.add(target.id); } 
                else { 
                    // 導彈減速 logic
                    const isMissile = p.type === 'missile';
                    const speed = isMissile ? 0.35 : (p.type === 'beam' ? 15.0 : 2.0); // 雷射極速
                    const vx = (dx / dist) * speed; const vy = (dy / dist) * speed; 
                    const angle = Math.atan2(dy, dx) * 180 / Math.PI; 
                    nextProjs.push({ ...p, x: p.x + vx, y: p.y + vy, angle }); 
                }
            });
            const nextExplosions = prev.explosions.map(e => ({ ...e, life: e.life - 1 })).filter(e => e.life > 0);
            
            // 碎片系統 (Particle System Update)
            let nextParticles = prev.particles.map(p => ({
                ...p,
                x: p.x + p.vx,
                y: p.y + p.vy,
                life: p.life - 1
            })).filter(p => p.life > 0);

            // 嚴格過濾已經處理過的擊殺 ID (Bug Fix)
            const newKills = [];
            if (hitWordIds.size > 0) { 
                hitWordIds.forEach(id => { 
                    if (!processedKillIds.current.has(id)) {
                        processedKillIds.current.add(id);
                        newKills.push(id);
                        const w = nextWords.find(word => word.id === id); 
                        if(w) {
                             nextExplosions.push({ id: Date.now() + Math.random(), x: w.x, y: w.y, life: 20 }); 
                             // 生成爆炸碎片 (8-12個)
                             for(let i=0; i<12; i++) {
                                 nextParticles.push({
                                     id: Math.random(),
                                     x: w.x, y: w.y,
                                     vx: (Math.random() - 0.5) * 1.5,
                                     vy: (Math.random() - 0.5) * 1.5,
                                     life: 30 + Math.random() * 10,
                                     color: ['#FFFF00', '#FF4500', '#FFA500', '#FFFFFF'][Math.floor(Math.random()*4)]
                                 });
                             }
                        }
                    }
                }); 
            }
            
            const finalWords = nextWords.filter(w => !hitWordIds.has(w.id));
            
            if (hpDamage > 0 || newKills.length > 0) {
                setTimeout(() => {
                    setGameStats(prevStats => {
                        const newHp = prevStats.hp - hpDamage;
                        if (newHp <= 0) { setScreen('gameover'); callGeminiAnalysis(prevStats.score, [...mistakes, ...missedWords]); }
                        const missed = hpDamage > 0;
                        return { 
                            ...prevStats, 
                            hp: newHp, 
                            score: prevStats.score + (newKills.length * 50), 
                            destroyedCount: prevStats.destroyedCount + newKills.length, 
                            streak: missed ? 0 : prevStats.streak 
                        };
                    });
                    if (hpDamage > 0) setMistakes(prev => [...prev, ...missedWords]);
                }, 0);
            }
            return { words: finalWords, projectiles: nextProjs, explosions: nextExplosions, particles: nextParticles };
        });
      }
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [screen, isPaused, mistakes]); 

  const checkInputMatch = (currentVal) => {
    const processedVal = processInput(currentVal);
    // 檢查所有可能：比對全方位比對清單
    return entitiesRef.current.words.find(w => !w.isLocked && (
        w.matchCandidates.includes(currentVal) || 
        w.matchCandidates.includes(processedVal)
    ));
  };
  
  const triggerRewardFlash = (type, text) => { setRewardFlash({ active: true, type, text }); setTimeout(() => setRewardFlash({ active: false, type: 0, text: "" }), 1500); };
  const handleCorrectInput = (matchWord) => {
      fireMissile(matchWord);
      setGameStats(prev => {
          const newStreak = prev.streak + 1; const newTotalCorrect = prev.totalCorrect + 1; let rewardType = 0; let rewardText = "";
          if (newTotalCorrect > 0 && newTotalCorrect % 20 === 0) { setBombs(b => ({ ...b, type3: b.type3 + 1 })); rewardType = 3; rewardText = "LIGHTNING GET!"; } 
          else if (newStreak > 0 && newStreak % 6 === 0) { setBombs(b => ({ ...b, type2: b.type2 + 1 })); rewardType = 2; rewardText = "BEAM GET!"; } 
          else if (newStreak > 0 && newStreak % 5 === 0) { setBombs(b => ({ ...b, type4: b.type4 + 1 })); rewardType = 4; rewardText = "FLASH+1"; }
          else if (newStreak > 0 && newStreak % 3 === 0) { setBombs(b => ({ ...b, type1: b.type1 + 1 })); rewardType = 1; rewardText = "MISSILE GET!"; }
          if (rewardType > 0) { triggerRewardFlash(rewardType, rewardText); }
          return { ...prev, streak: newStreak, totalCorrect: newTotalCorrect };
      });
      setInputValue(''); setTimeout(() => setInputValue(''), 0);
  };
  const handleInputChange = (e) => { if (isPaused) return; const rawVal = e.target.value.toLowerCase(); setInputValue(rawVal); setIsInputError(false); if (isComposing) return; const matchWord = checkInputMatch(rawVal); if (matchWord) { handleCorrectInput(matchWord); } };
  const handleInputKeyDown = (e) => { if (isComposing || e.nativeEvent.isComposing) return; if (e.key === 'Enter') { const matchWord = checkInputMatch(inputValue); if (matchWord) { handleCorrectInput(matchWord); } else if (inputValue.length > 0) { setIsInputError(true); setTimeout(() => setIsInputError(false), 500); } } };
  const fireMissile = (targetWord) => { 
      // 標記為鎖定 (不立即移除，等待子彈擊中)
      setGameEntities(prev => ({ ...prev, words: prev.words.map(w => w.id === targetWord.id ? { ...w, isLocked: true } : w), projectiles: [...prev.projectiles, { id: Date.now() + Math.random(), x: 50, y: isKeyboardOpen ? 75 : 85, targetId: targetWord.id, type: 'normal', angle: -90 }] })); 
      playSound('shoot');
  };
  
  const useBomb = (type) => {
    if (screen !== 'game' || isPaused) return;
    let targets = []; const currentWords = entitiesRef.current.words; const activeWords = currentWords.filter(w => !w.isLocked);
    
    if (type === 4 && bombs.type4 > 0 && activeWords.length > 0) {
        setBombs(b => ({ ...b, type4: b.type4 - 1 }));
        playSound('flashlight');
        const target = activeWords.filter(w => !w.isRevealed).reduce((prev, current) => (prev && prev.y > current.y) ? prev : current, null);
        if (target) {
            setGameEntities(prev => ({ ...prev, words: prev.words.map(w => w.id === target.id ? { ...w, isRevealed: true } : w) }));
            setRevealedWords(prev => [...prev, target]);
            return;
        }
    }

    if (type === 1 && bombs.type1 > 0 && activeWords.length > 0) { 
        setBombs(b => ({ ...b, type1: b.type1 - 1 })); 
        targets = [activeWords.reduce((prev, current) => (prev.y > current.y) ? prev : current)]; 
    } 
    else if (type === 2 && bombs.type2 > 0 && activeWords.length > 0) { 
        setBombs(b => ({ ...b, type2: b.type2 - 1 })); 
        const count = Math.ceil(activeWords.length / 2); targets = activeWords.sort((a, b) => b.y - a.y).slice(0, count); 
    }
    else if (type === 3 && bombs.type3 > 0 && activeWords.length > 0) { 
        setBombs(b => ({ ...b, type3: b.type3 - 1 })); 
        targets = activeWords; 
    }
    
    if (targets.length > 0) { 
        const targetIds = targets.map(t => t.id); 
        
        // 統一處理：所有攻擊性道具都立即發射
        setGameEntities(prev => { 
            const updatedWords = prev.words.map(w => targetIds.includes(w.id) ? { ...w, isLocked: true } : w); 
            const newProjectiles = targets.map(t => ({ 
                id: Date.now() + Math.random(), 
                x: 50, 
                y: isKeyboardOpen ? 75 : 85, 
                targetId: t.id, 
                targetX: t.x, 
                targetY: t.y, 
                type: type === 1 ? 'missile' : (type === 2 ? 'beam' : 'lightning'), 
                angle: -90 
            })); 
            return { ...prev, words: updatedWords, projectiles: [...prev.projectiles, ...newProjectiles] }; 
        }); 

        // 統一播放音效
        if (type === 1) playSound('missile');
        else if (type === 2) playSound('beam');
        else if (type === 3) playSound('lightning');
    }
  };
  
  return (
    <div className="fixed inset-0 w-full h-full bg-black text-white font-sans overflow-hidden select-none flex flex-col md:flex-row">
      <StarBackground /><audio ref={audioRef} src="https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/theme_01.mp3" loop />
      {screen !== 'game' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90">
          <button onClick={toggleMute} className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-gray-800/80 hover:bg-gray-700 rounded-full border border-gray-600 text-yellow-400 transition-all z-[60] shadow-lg group" title={isMuted ? "開啟音效" : "靜音"}>{isMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}</button>
          {screen === 'intro' && <IntroScreen onStart={() => setScreen('name')} onShowLeaderboard={handleShowLeaderboard} />}
          {screen === 'leaderboard' && <LeaderboardScreen onBack={() => setScreen('intro')} />}
          {screen === 'name' && <NameScreen name={playerData.name} setName={(n) => setPlayerData(prev => ({ ...prev, name: n }))} onSubmit={handleNameSubmit} isComposing={isComposing} setIsComposing={setIsComposing} />}
          {screen === 'mode' && <ModeScreen onSelect={() => setScreen('system')} />}
          {screen === 'system' && <SystemScreen onSelect={handleSystemSelect} />}
          {screen === 'accent' && <AccentScreen onSelect={handleAccentSelect} />}
          {screen === 'tutorial' && <TutorialScreen onNext={handleTutorialComplete} />}
          {screen === 'difficulty' && <DifficultyScreen onSelect={handleDifficultySelect} />}
          {screen === 'range' && <RangeScreen onSelect={handleRangeSelect} />}
          {screen === 'display' && <DisplayModeScreen onSelect={startGame} />}
          {screen === 'gameover' && <GameOverScreen score={gameStats.score} destroyedCount={gameStats.destroyedCount} name={playerData.name} geminiAnalysis={geminiAnalysis} onAnalyze={callGeminiAnalysis} isAnalyzing={isAnalyzing} mistakes={mistakes} revealedWords={revealedWords} onRestart={handleRestart} difficulty={playerData.difficulty} playerData={playerData} />}
        </div>
      )}
      {screen === 'game' && (
        <>
          <RewardNotification reward={rewardFlash} />
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-40"><WaveNotification waveMessage={waveMessage} /></div>
          {isPaused && (<div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center"><div className="bg-gray-900 border-2 border-yellow-500 p-8 rounded-2xl text-center shadow-[0_0_50px_rgba(234,179,8,0.5)] max-w-sm w-full mx-4"><h2 className="text-5xl font-black text-yellow-400 mb-8 tracking-widest drop-shadow-lg">PAUSED</h2><div className="flex flex-col gap-4"><button onClick={togglePause} className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-xl font-bold transition-transform active:scale-95 shadow-lg"><Play size={24} fill="white" /> RESUME</button><button onClick={() => setScreen('intro')} className="flex items-center justify-center gap-3 px-8 py-4 bg-red-900/80 hover:bg-red-800 border border-red-600 rounded-xl text-xl font-bold text-red-100 transition-transform active:scale-95"><X size={24} /> QUIT</button></div></div></div>)}
          <div className={`w-full p-3 bg-gradient-to-b from-black/80 to-transparent z-40 shrink-0 flex justify-between items-start md:hidden ${isKeyboardOpen ? 'h-0 overflow-hidden p-0 opacity-0' : ''}`}><HUD playerData={playerData} gameStats={gameStats} nextTarget={nextTarget} isMuted={isMuted} isPaused={isPaused} toggleMute={toggleMute} togglePause={togglePause} isKeyboardOpen={isKeyboardOpen} displayMode={displayMode} /></div>
          <div ref={gameAreaRef} className="flex-1 relative w-full overflow-hidden order-1 md:order-1"><WordLayer words={gameEntities.words} projectiles={gameEntities.projectiles} explosions={gameEntities.explosions} system={playerData.system} accent={playerData.accent} displayMode={displayMode} particles={gameEntities.particles} /><ControlDeck inputValue={inputValue} isInputError={isInputError} isPaused={isPaused} isKeyboardOpen={isKeyboardOpen} bombs={bombs} onInputChange={handleInputChange} onKeyDown={handleInputKeyDown} onFocus={handleInputFocus} onBlur={handleInputBlur} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} useBomb={useBomb} score={gameStats.score} displayMode={displayMode} /></div>
          <DesktopCommandCenter gameStats={gameStats} playerData={playerData} nextTarget={nextTarget} isMuted={isMuted} isPaused={isPaused} toggleMute={toggleMute} togglePause={togglePause} displayMode={displayMode} />
        </>
      )}
      <style>{`
        @keyframes twinkle { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
        .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
        .animate-spin-slow { animation: spin 3s linear infinite; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 2; }
        @keyframes bounce-in { 0% { transform: translate(-50%, -50%) scale(0); opacity: 0; } 50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 0; } }
        .animate-bounce-in { animation: bounce-in 1.5s ease-out forwards; }
        @keyframes flash { 0% { opacity: 1; } 100% { opacity: 0; } }
        .animate-flash { animation: flash 0.3s ease-out forwards; }
        @keyframes blast-wave { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
        .animate-blast-wave { animation: blast-wave 0.5s ease-out forwards; }
        @keyframes blast-core { 0% { transform: scale(0.5); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.8; } 100% { transform: scale(0); opacity: 0; } }
        .animate-blast-core { animation: blast-core 0.4s ease-out forwards; }
        @keyframes blast-flash { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.5); } }
        .animate-blast-flash { animation: blast-flash 0.2s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { bg: #1a1a1a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #333; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #555; }
      `}</style>
    </div>
  );
}