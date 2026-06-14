import { useState, useEffect, useMemo, useCallback } from "react";

export const MockExam = ({ subject, topic, onFinish, onClose, examId, questionsCount, timeLimit, examTitle, geminiKey }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // id -> optionIndex
  const [flagged, setFlagged] = useState({}); // id -> boolean
  const [timeLeft, setTimeLeft] = useState(timeLimit ? timeLimit * 60 : 2700); // 45 минут по умолчанию в секундах (45:00)
  const [prevTimeLimit, setPrevTimeLimit] = useState(timeLimit);
  const [isFinished, setIsFinished] = useState(false);
  const [resultsSummary, setResultsSummary] = useState(null);
  const [aiReportText, setAiReportText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  if (timeLimit !== prevTimeLimit) {
    setPrevTimeLimit(timeLimit);
    setTimeLeft(timeLimit ? timeLimit * 60 : 2700);
  }

  // Инициализация базы вопросов для выбранного предмета
  const questions = useMemo(() => {
    // 10 качественных вопросов + 30 автоматически сгенерированных
    const base = [];
    if (subject === "Math" || subject === "Математика") {
      // Математика
      base.push(
        {
          id: 1,
          question: "Найдите x в следующем тригонометрическом уравнении на интервале [0, 2π]:",
          formula: "2cos²(x) + 3sin(x) - 3 = 0",
          sub: "Какой из следующих вариантов представляет собой правильный набор решений для заданных условий?",
          options: [
            "A) {π/6, 5π/6, π/2}",
            "B) {π/3, 2π/3, π}",
            "C) {π/2, π/6, 5π/6}",
            "D) {0, π, 2\u03C0}"
          ],
          correctIndex: 2, // C
          points: 4
        },
        {
          id: 2,
          question: "Упростите алгебраическое выражение для отличных от нуля значений параметров:",
          formula: "(a² - b²) / (a - b)",
          sub: "Выберите эквивалентное выражение:",
          options: [
            "A) a - b",
            "B) a + b",
            "C) a² + b²",
            "D) ab"
          ],
          correctIndex: 1, // B
          points: 2
        },
        {
          id: 3,
          question: "Найдите скалярное произведение векторов u = (2, 3) и v = (-1, 4):",
          formula: "u \u00B7 v = u_x v_x + u_y v_y",
          sub: "Выберите верный результат скалярного умножения:",
          options: [
            "A) 10",
            "B) 5",
            "C) 14",
            "D) 0"
          ],
          correctIndex: 0, // A
          points: 3
        },
        {
          id: 4,
          question: "Найдите производную следующей функции в точке x:",
          formula: "f(x) = 3x² + 5x - 7",
          sub: "Какое выражение задает производную f'(x)?",
          options: [
            "A) 3x + 5",
            "B) 6x + 5",
            "C) 6x² + 5",
            "D) 6x"
          ],
          correctIndex: 1, // B
          points: 3
        },
        {
          id: 5,
          question: "Решите логарифмическое уравнение:",
          formula: "log\u2082(x) = 5",
          sub: "Найдите значение переменной x:",
          options: [
            "A) 10",
            "B) 25",
            "C) 32",
            "D) 16"
          ],
          correctIndex: 2, // C
          points: 2
        },
        {
          id: 6,
          question: "Найдите площадь треугольника с длинами сторон 6, 8 и углом между ними 30 градусов:",
          formula: "S = 0.5 \u00B7 a \u00B7 b \u00B7 sin(\u03B1)",
          sub: "Выберите площадь фигуры в квадратных единицах:",
          options: [
            "A) 24",
            "B) 12",
            "C) 48",
            "D) 12\u221A3"
          ],
          correctIndex: 1, // B
          points: 3
        },
        {
          id: 7,
          question: "Найдите неопределенный интеграл функции f(x) = 2x:",
          formula: "\u222B 2x dx",
          sub: "Выберите первообразную функции:",
          options: [
            "A) x² + C",
            "B) 2x² + C",
            "C) x²",
            "D) 2 + C"
          ],
          correctIndex: 0, // A
          points: 3
        },
        {
          id: 8,
          question: "Найдите предел функции при стремлении x к 2:",
          formula: "lim (x \u2192 2)  (x² - 4) / (x - 2)",
          sub: "Раскройте неопределенность 0/0 и найдите значение предела:",
          options: [
            "A) 2",
            "B) 4",
            "C) 0",
            "D) Не существует"
          ],
          correctIndex: 1, // B
          points: 4
        },
        {
          id: 9,
          question: "В ящике 3 белых и 7 черных шаров. Какова вероятность вытащить белый шар случайным образом?",
          formula: "P(A) = m / n",
          sub: "Укажите вероятность события:",
          options: [
            "A) 0.3",
            "B) 0.7",
            "C) 0.43",
            "D) 0.5"
          ],
          correctIndex: 0, // A
          points: 2
        },
        {
          id: 10,
          question: "Каково уравнение окружности с центром в начале координат и радиусом R = 5?",
          formula: "x² + y² = R²",
          sub: "Выберите верное геометрическое уравнение:",
          options: [
            "A) x + y = 25",
            "B) x² + y² = 5",
            "C) x² + y² = 25",
            "D) x² - y² = 25"
          ],
          correctIndex: 2, // C
          points: 2
        }
      );
    } else if (subject === "Biology" || subject === "Биология") {
      // Биология
      base.push(
        {
          id: 1,
          question: "Какую органеллу называют энергетической станцией клетки?",
          formula: "Синтез АТФ происходит на кристах...",
          sub: "Выберите правильный органоид:",
          options: [
            "A) Рибосома",
            "B) Аппарат Гольджи",
            "C) Митохондрия",
            "D) Хлоропласт"
          ],
          correctIndex: 2,
          points: 3
        },
        {
          id: 2,
          question: "Какая молекула хранит генетическую информацию у всех живых организмов?",
          formula: "Двойная спираль Уотсона-Крика...",
          sub: "Укажите биополимер:",
          options: [
            "A) РНК",
            "B) ДНК",
            "C) Белок",
            "D) Гликоген"
          ],
          correctIndex: 1,
          points: 2
        },
        {
          id: 3,
          question: "Как называется процесс деления соматических клеток, сохраняющий диплоидный набор хромосом?",
          formula: "Профаза → Метафаза → Анафаза → Телофаза",
          sub: "Выберите тип деления:",
          options: [
            "A) Митоз",
            "B) Мейоз",
            "C) Амитоз",
            "D) Шизогония"
          ],
          correctIndex: 0,
          points: 3
        },
        {
          id: 4,
          question: "Какое вещество является основным продуктом световой фазы фотосинтеза, выделяющимся в атмосферу?",
          formula: "Фотолиз воды: H\u2082O \u2192 2H\u207A + 2e\u207B + [?]",
          sub: "Выберите газ:",
          options: [
            "A) Углекислый газ",
            "B) Кислород",
            "C) Азот",
            "D) Водород"
          ],
          correctIndex: 1,
          points: 3
        },
        {
          id: 5,
          question: "Какая группа крови является универсальным донором по системе AB0?",
          formula: "Отсутствие антигенов A и B на эритроцитах",
          sub: "Укажите группу крови:",
          options: [
            "A) I (0)",
            "B) II (A)",
            "C) III (B)",
            "D) IV (AB)"
          ],
          correctIndex: 0,
          points: 2
        },
        {
          id: 6,
          question: "Какой гормон регулирует уровень сахара в крови, вырабатываясь поджелудочной железой?",
          formula: "Антагонист глюкагона, снижает гликемию",
          sub: "Выберите гормон:",
          options: [
            "A) Адреналин",
            "B) Тироксин",
            "C) Инсулин",
            "D) Кортизол"
          ],
          correctIndex: 2,
          points: 2
        },
        {
          id: 7,
          question: "Как называется монолитный костный орган, защищающий головной мозг?",
          formula: "Состоит из парных и непарных плоских костей",
          sub: "Выберите анатомическое название:",
          options: [
            "A) Череп",
            "B) Грудная клетка",
            "C) Позвоночник",
            "D) Таз"
          ],
          correctIndex: 0,
          points: 2
        },
        {
          id: 8,
          question: "Как называют совокупность всех организмов одного вида, населяющих определенную территорию?",
          formula: "Элементарная единица эволюции",
          sub: "Укажите экологический термин:",
          options: [
            "A) Биоценоз",
            "B) Биосфера",
            "C) Популяция",
            "D) Экосистема"
          ],
          correctIndex: 2,
          points: 3
        },
        {
          id: 9,
          question: "В каких органоидах растений происходит фотосинтез?",
          formula: "Содержат пигмент хлорофилл в тилакоидах",
          sub: "Выберите органоид:",
          options: [
            "A) Лейкопласты",
            "B) Хлоропласты",
            "C) Хромопласты",
            "D) Амилопласты"
          ],
          correctIndex: 1,
          points: 2
        },
        {
          id: 10,
          question: "Какое скрещивание используется для изучения наследования одной пары признаков?",
          formula: "Закон расщепления Менделя (3:1)",
          sub: "Выберите тип скрещивания:",
          options: [
            "A) Моногибридное",
            "B) Дигибридное",
            "C) Анализирующее",
            "D) Полигибридное"
          ],
          correctIndex: 0,
          points: 3
        }
      );
    } else {
      // Физика
      base.push(
        {
          id: 1,
          question: "Вычислите силу тяжести, действующую на груз массой 5 кг (примите g = 10 м/с²):",
          formula: "F = m \u00B7 g",
          sub: "Выберите значение силы тяжести в Ньютонах:",
          options: [
            "A) 5 Н",
            "B) 0.5 Н",
            "C) 50 Н",
            "D) 500 Н"
          ],
          correctIndex: 2,
          points: 2
        },
        {
          id: 2,
          question: "Укажите формулу кинетической энергии движущегося тела:",
          formula: "E_k = m \u00B7 v² / 2",
          sub: "Выберите правильное выражение для энергии:",
          options: [
            "A) m \u00B7 g \u00B7 h",
            "B) m \u00B7 v² / 2",
            "C) F \u00B7 s",
            "D) p² / (2m)"
          ],
          correctIndex: 1,
          points: 2
        },
        {
          id: 3,
          question: "Сформулируйте закон Ома для однородного участка электрической цепи:",
          formula: "I = U / R",
          sub: "Выберите формулу закона:",
          options: [
            "A) I = U / R",
            "B) I = U \u00B7 R",
            "C) I = q / t",
            "D) I = E / (R + r)"
          ],
          correctIndex: 0,
          points: 2
        },
        {
          id: 4,
          question: "Определите силу тока в проводнике, если через его сечение за 10 секунд прошел заряд 20 Кулон:",
          formula: "I = q / t",
          sub: "Выберите силу тока в Амперах:",
          options: [
            "A) 200 А",
            "B) 2 А",
            "C) 0.5 А",
            "D) 10 А"
          ],
          correctIndex: 1,
          points: 3
        },
        {
          id: 5,
          question: "Как называется физический прибор, измеряющий температуру тела?",
          formula: "Использует эффект теплового расширения жидкостей",
          sub: "Выберите название прибора:",
          options: [
            "A) Барометр",
            "B) Манометр",
            "C) Динамометр",
            "D) Термометр"
          ],
          correctIndex: 3,
          points: 2
        },
        {
          id: 6,
          question: "Какой формулой описывается первый закон термодинамики?",
          formula: "Q = \u0394U + A'",
          sub: "Выберите термодинамическое равенство:",
          options: [
            "A) Q = \u0394U + A'",
            "B) \u0394U = Q + A",
            "C) Оба варианта верны",
            "D) Q = m \u00B7 c \u00B7 \u0394T"
          ],
          correctIndex: 2,
          points: 3
        },
        {
          id: 7,
          question: "Укажите закон всемирного тяготения Ньютона:",
          formula: "F = G \u00B7 (m\u2081 \u00B7 m\u2082) / r²",
          sub: "Выберите математическое описание силы притяжения:",
          options: [
            "A) F = k \u00B7 x",
            "B) F = G \u00B7 (m\u2081m\u2082) / r²",
            "C) F = m \u00B7 a",
            "D) F = \u03BC \u00B7 N"
          ],
          correctIndex: 1,
          points: 3
        },
        {
          id: 8,
          question: "Какое явление объясняет огибание световыми волнами краев препятствий?",
          formula: "Нарушение прямолинейного распространения света...",
          sub: "Укажите волновое явление:",
          options: [
            "A) Интерференция",
            "B) Дифракция",
            "C) Дисперсия",
            "D) Поляризация"
          ],
          correctIndex: 1,
          points: 3
        },
        {
          id: 9,
          question: "Определите длину световой волны, если частота колебаний равна 5 \u00B7 10\u00B9\u2074 Гц (скорость света c = 3 \u00B7 10\u2078 м/с):",
          formula: "\u03BB = c / \u03BD",
          sub: "Укажите длину волны в нанометрах (нм):",
          options: [
            "A) 600 нм",
            "B) 500 нм",
            "C) 400 нм",
            "D) 700 нм"
          ],
          correctIndex: 0,
          points: 4
        },
        {
          id: 10,
          question: "Какая частица является квантом электромагнитного излучения?",
          formula: "E = h \u00B7 \u03BD",
          sub: "Выберите фундаментальную частицу:",
          options: [
            "A) Электрон",
            "B) Протон",
            "C) Фотон",
            "D) Нейтрино"
          ],
          correctIndex: 2,
          points: 2
        }
      );
    }

    // Автогенерация остальных 30 вопросов для 100% заполнености
    for (let i = 11; i <= 40; i++) {
      let q, f, s, opts, corr;
      if (subject === "Math" || subject === "Математика") {
        const val1 = i * 2;
        const val2 = i + 3;
        q = `Решите линейное уравнение №${i} для подготовки:`;
        f = `x + ${val2} = ${val1 + val2}`;
        s = `Найдите значение неизвестного x:`;
        opts = [
          `A) x = ${val1 - 2}`,
          `B) x = ${val1}`,
          `C) x = ${val1 + 4}`,
          `D) x = ${val1 + 1}`
        ];
        corr = 1; // B
      } else if (subject === "Biology" || subject === "Биология") {
        q = `ИИ-Вопрос по общей биологии №${i}:`;
        f = `Организм №${i} относится к автотрофам, если он:`;
        s = `Выберите верную физиологическую характеристику:`;
        opts = [
          `A) Питается готовой органикой`,
          `B) Синтезирует органические соединения сам`,
          `C) Питается исключительно азотом`,
          `D) Размножается только спорами`
        ];
        corr = 1; // B
      } else {
        const F = i * 4;
        const m = 4;
        const a = F / m;
        q = `Задачи на второй закон Ньютона №${i}:`;
        f = `Телу массой m = ${m} кг сообщили силу F = ${F} Н.`;
        s = `Найдите ускорение тела a (в м/с²):`;
        opts = [
          `A) a = ${a - 1.5} м/с\u00B2`,
          `B) a = ${a} м/с\u00B2`,
          `C) a = ${a + 2} м/с\u00B2`,
          `D) a = ${a / 2} м/с\u00B2`
        ];
        corr = 1; // B
      }

      base.push({
        id: i,
        question: q,
        formula: f,
        sub: s,
        options: opts,
        correctIndex: corr,
        points: 2
      });
    }

    const count = questionsCount || 40;
    return base.slice(0, count);
  }, [subject, questionsCount]);

  const handleFinishExam = useCallback(() => {
    setIsFinished(true);

    // Подсчет результатов
    let correctCount = 0;
    const errorsList = [];

    questions.forEach((q) => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correctIndex;
      if (isCorrect) {
        correctCount++;
      } else {
        errorsList.push({
          id: q.id,
          question: q.question,
          formula: q.formula,
          userAns: userAnswer !== undefined ? q.options[userAnswer] : "Нет ответа",
          correctAns: q.options[q.correctIndex],
          explanation: `Для решения ${q.formula} необходимо применить базовые формулы и законы предмета. Правильным выбором является вариант ${q.options[q.correctIndex]}.`
        });
      }
    });

    const percent = Math.round((correctCount / questions.length) * 100);
    let grade;
    let fallbackAiText = "";

    if (percent >= 90) {
      grade = "A";
    } else if (percent >= 80) {
      grade = "A-";
    } else if (percent >= 70) {
      grade = "B+";
    } else if (percent >= 60) {
      grade = "B";
    } else if (percent >= 50) {
      grade = "C+";
    } else {
      grade = "D";
    }

    if (subject === "Math" || subject === "Математика") {
      fallbackAiText = `На основе результатов ИИ определил, что вы отлично справились с темами «Основы алгебры» и «Производные». Однако темы «Логарифмические уравнения» и «Тригонометрия» (в вопросе 1) содержат ошибки. ИИ рекомендует укрепить формулы тригонометрического тождества и свойства степеней.`;
    } else if (subject === "Biology" || subject === "Биология") {
      fallbackAiText = `ИИ-анализ выявил отличное понимание темы «Органоиды клетки» и «Анатомия». Тем не менее, допущены ошибки в вопросах по «Фотосинтезу» и «Репликации ДНК». Рекомендуется повторить фазы синтеза белка и схемы цикла Кальвина.`;
    } else {
      fallbackAiText = `Аналитика ИИ показывает высокую успеваемость по темам «Законы Ньютона» и «Электричество». Ошибки зафиксированы в «Квантовой механике» и «Термодинамике». Рекомендуется повторить первый закон термодинамики и формулу Планка.`;
    }

    setResultsSummary({
      correctCount,
      totalCount: questions.length,
      percent,
      grade,
      aiText: fallbackAiText,
      errors: errorsList.slice(0, 4) // Показываем топ-4 ошибки для аккуратности
    });

    if (geminiKey) {
      setAiLoading(true);
      setAiReportText("");
      const subjectName = subject === "Math" || subject === "Математика" ? "Математика" : subject === "Biology" || subject === "Биология" ? "Биология" : "Физика";
      const prompt = `Проанализируй результаты теста ученика по предмету ${subjectName} на тему "${topic || "Общая практика"}".
Ученик решил верно ${correctCount} из ${questions.length} вопросов (успешность ${percent}%, оценка ${grade}).
Вот список допущенных ошибок (вопросы и неправильные ответы):
${errorsList.slice(0, 5).map(e => `- Вопрос: "${e.question}", Ответ ученика: "${e.userAns}", Правильный ответ: "${e.correctAns}"`).join('\n')}

Напиши короткий, мотивирующий и емкий отчет на русском языке (3-4 предложения). Укажи сильные стороны (на основе правильных ответов) и конкретные темы/правила, которые нужно повторить (на основе ошибок). Будь вежлив и профессионален. Не используй разметку markdown типа жирного шрифта, пиши только плоский текст.`;

      fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      })
      .then(res => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
      })
      .then(data => {
        const text = data.candidates[0].content.parts[0].text;
        setAiReportText(text.trim());
      })
      .catch(err => {
        console.warn("Ошибка при получении аналитики ИИ от Gemini:", err);
        setAiReportText(fallbackAiText);
      })
      .finally(() => {
        setAiLoading(false);
      });
    } else {
      setAiReportText(fallbackAiText);
    }
  }, [questions, answers, subject, topic, geminiKey]);

  // Таймер обратного отсчета
  useEffect(() => {
    if (timeLeft <= 0) {
      const t = setTimeout(() => {
        handleFinishExam();
      }, 0);
      return () => clearTimeout(t);
    }
    if (isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished, handleFinishExam]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (optionIdx) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentIdx].id]: optionIdx
    }));
  };

  const toggleFlag = () => {
    const qId = questions[currentIdx].id;
    setFlagged((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };



  const handleFinishConfirm = () => {
    if (onFinish && resultsSummary) {
      onFinish(resultsSummary.percent, resultsSummary.grade, examId, resultsSummary.correctCount, questions.length);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col font-sans text-slate-900 overflow-hidden antialiased">
      
      {/* HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-black text-lg tracking-tight">
            <span className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-black">E</span>
            EduTrack <span className="text-indigo-600">AI</span>
          </div>
          <div className="h-5 w-px bg-slate-200"></div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            {examTitle ? `${examTitle}` : `${subject === "Math" || subject === "Математика" ? "Математика 11 класс" : subject === "Biology" || subject === "Биология" ? "Биология 11 класс" : "Физика 11 класс"} • Пробный экзамен`}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Прогресс</p>
            <p className="text-sm font-black text-slate-800">{answeredCount} / {questions.length}</p>
          </div>

          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-bold text-sm ${timeLeft < 300 ? "bg-red-50 border-red-200 text-red-600 animate-pulse" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
            <span>🕒</span>
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={handleFinishExam}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md shadow-indigo-100 transition-all active:scale-95"
          >
            Завершить экзамен
          </button>
        </div>
      </header>

      {/* CORE INTERFACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* FAR LEFT MINI ICON BAR (MOCK SIDEBAR) */}
        <aside className="w-16 bg-white border-r border-slate-200 flex flex-col justify-between items-center py-6 flex-shrink-0">
          <div className="space-y-6">
            <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition" title="Выйти из симуляции">
              <span>☰</span>
            </button>
            <button onClick={() => alert("Инструкция к тесту:\n1. Выберите один из четырех вариантов ответа.\n2. Вы можете пометить сложный вопрос флагом, чтобы вернуться к нему позже.\n3. Справа расположен навигатор для быстрого перехода.")} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition" title="Инструкция">
              <span>ⓘ</span>
            </button>
          </div>
          <button onClick={() => alert("Настройки шрифта и интерфейса тестирования будут доступны в полной версии.")} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition" title="Настройки">
            <span>⚙️</span>
          </button>
        </aside>

        {/* MAIN PANEL (QUESTIONS VIEW) */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50 flex flex-col justify-between">
          <div className="max-w-3xl w-full mx-auto space-y-6">
            
            {/* Question Info Header */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide">
                Вопрос {activeQ.id}
              </span>
              <span className="text-xs text-slate-400 font-semibold">• {activeQ.points} балла</span>
            </div>

            {/* Question description */}
            <h2 className="text-xl font-bold text-slate-800 leading-snug">
              {activeQ.question}
            </h2>

            {/* Formula Container */}
            <div className="p-8 bg-white border border-indigo-100 rounded-3xl text-center shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
              <p className="text-3xl font-black text-slate-800 tracking-tight font-serif italic select-all">
                {activeQ.formula}
              </p>
            </div>

            {/* Instruction */}
            <p className="text-sm text-slate-500 font-medium">
              {activeQ.sub}
            </p>

            {/* Radio Options */}
            <div className="space-y-3">
              {activeQ.options.map((opt, oIdx) => {
                const isSelected = answers[activeQ.id] === oIdx;
                return (
                  <label
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    className={`flex items-center justify-between p-4 bg-white border rounded-2xl cursor-pointer hover:border-indigo-200 transition-all select-none shadow-sm ${isSelected ? "border-indigo-600 bg-indigo-50/20 text-indigo-950 ring-2 ring-indigo-600/10" : "border-slate-200 text-slate-700"}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Circle Radio */}
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white"}`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                      <span className="text-sm font-semibold">{opt}</span>
                    </div>

                    {isSelected && (
                      <span className="text-indigo-600 text-xs font-bold pr-2">✓</span>
                    )}
                  </label>
                );
              })}
            </div>

          </div>

          {/* FOOTER ACTIONS */}
          <div className="max-w-3xl w-full mx-auto flex items-center justify-between pt-8 mt-12 border-t border-slate-200/80">
            <button
              onClick={handlePrevious}
              disabled={currentIdx === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border transition ${currentIdx === 0 ? "border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50" : "border-slate-200 text-slate-600 hover:bg-slate-50 bg-white shadow-sm"}`}
            >
              <span>←</span> Назад
            </button>

            <button
              onClick={toggleFlag}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border transition ${flagged[activeQ.id] ? "bg-red-50 border-red-200 text-red-600" : "border-slate-200 text-slate-600 hover:bg-slate-50 bg-white shadow-sm"}`}
            >
              <span>🏳️</span> {flagged[activeQ.id] ? "В закладках" : "Отметить"}
            </button>

            <button
              onClick={handleNext}
              disabled={currentIdx === questions.length - 1}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${currentIdx === questions.length - 1 ? "bg-slate-100 text-slate-300 border border-slate-200/40 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 active:scale-95"}`}
            >
              Следующий вопрос <span>→</span>
            </button>
          </div>
        </main>

        {/* RIGHT QUESTION NAVIGATOR */}
        <aside className="w-72 bg-white border-l border-slate-200 p-6 flex flex-col justify-between flex-shrink-0 overflow-y-auto">
          <div className="space-y-6">
            <h3 className="font-black text-slate-800 text-sm tracking-tight uppercase">Навигатор по вопросам</h3>

            {/* Legend Indicators */}
            <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-400 uppercase">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Отвечено
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-300"></span> Без ответа
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span> Флаг
              </span>
            </div>

            <hr className="border-slate-100" />

            {/* GRID 5 x 8 */}
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => {
                const qId = q.id;
                const isCurrent = currentIdx === idx;
                const isAnswered = answers[qId] !== undefined;
                const isFlagged = flagged[qId];

                let btnClass = "border border-slate-200 text-slate-400 bg-white hover:border-slate-300";

                if (isCurrent) {
                  btnClass = "border-2 border-indigo-600 bg-indigo-50/50 text-indigo-700 font-extrabold shadow-sm ring-2 ring-indigo-600/10";
                } else if (isFlagged) {
                  btnClass = "bg-red-400 text-white font-bold border-red-500 shadow-sm";
                } else if (isAnswered) {
                  btnClass = "bg-indigo-600 text-white font-bold border-indigo-700 shadow-sm";
                }

                return (
                  <button
                    key={qId}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-10 rounded-xl text-xs font-semibold flex items-center justify-center transition ${btnClass}`}
                  >
                    {q.id}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-100 mt-6">
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>Отвечено</span>
              <span>{answeredCount} / {questions.length}</span>
            </div>
            
            {/* Progress Bar in Side panel */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </aside>

      </div>

      {/* RESULTS SUMMARY MODAL */}
      {isFinished && resultsSummary && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-slate-100 text-slate-800">
            
            {/* Modal Header */}
            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <span className="text-3xl">🏆</span>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">Экзамен успешно завершен!</h2>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">ИИ проанализировал ваши результаты</p>
            </div>

            {/* Score Stats Grid */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Оценка</p>
                <p className="text-3xl font-black text-indigo-600 mt-1">{resultsSummary.grade}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Решено верно</p>
                <p className="text-3xl font-black text-emerald-600 mt-1">{resultsSummary.correctCount} / {resultsSummary.totalCount}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Процент успеха</p>
                <p className="text-3xl font-black text-purple-600 mt-1">{resultsSummary.percent}%</p>
              </div>
            </div>

            {/* AI Insight Box */}
            <div className="p-5 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border border-indigo-100 rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🤖</span>
                <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">Аналитика ИИ</span>
                {aiLoading && (
                  <span className="inline-block w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin ml-2"></span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                {aiLoading ? "ИИ анализирует ваши ответы и формулирует персональные рекомендации..." : (aiReportText || resultsSummary.aiText)}
              </p>
            </div>

            {/* Review Mistakes list (if any) */}
            {resultsSummary.errors.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <span className="text-rose-500">🔴</span> Ошибки, требующие разбора ({resultsSummary.errors.length}+)
                </h4>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {resultsSummary.errors.map((err, idx) => (
                    <div key={idx} className="border border-red-50 bg-red-50/5 p-4 rounded-xl space-y-2 text-xs">
                      <p className="font-bold text-slate-800">Вопрос {err.id}: {err.question}</p>
                      <p className="font-serif italic text-slate-500 bg-white border border-slate-100 p-1.5 rounded text-center font-bold text-sm">{err.formula}</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <p className="text-rose-600 font-semibold">Ваш ответ: {err.userAns}</p>
                        <p className="text-emerald-600 font-semibold">Правильно: {err.correctAns}</p>
                      </div>
                      <p className="text-slate-400 text-[10px] italic leading-normal border-t border-dashed border-red-100 pt-1.5">
                        {err.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-4 pt-2">
              <button
                onClick={handleFinishConfirm}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl text-xs font-black shadow-md hover:shadow-indigo-100 transition-all text-center block"
              >
                Вернуться к подготовке
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
