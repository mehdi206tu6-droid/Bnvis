import { Type } from "@google/genai";
import { Agent } from '../types';
import { 
    TargetIcon, HealthIcon, FinanceIcon, EducationIcon, HabitsIcon, SparklesIcon,
    MoonIcon, LightBulbIcon, DocumentTextIcon, ChartBarIcon, FlagIcon,
    PencilIcon, BookOpenIcon, UserIcon, ClockIcon, BoltIcon, CloudIcon,
    MagnifyingGlassIcon, ScaleIcon, RouteIcon, BrainIcon, ShareIcon,
    CalendarIcon, StarIcon, FaceSmileIcon, LeafIcon, LockClosedIcon, ReceiptPercentIcon,
    BriefcaseIcon
} from '../components/icons';

export const agents: Agent[] = [
    {
        id: 'mood-weather',
        title: 'آب و هوای خلقی',
        description: 'وضعیت عاطفی روزانه شما را بر اساس داده‌ها تحلیل می‌کند.',
        icon: CloudIcon,
        model: 'gemini-2.5-pro',
        systemPrompt: `[ROLE=system]
تو یک تحلیلگر احساسات و مولد UI summary برای Benvis Life OS هستی. هدف: از ورودی‌های کاربر (journalText, sleepData, habitCompletions, activitySummary) وضعیت عاطفیِ روزانه را استخراج کن و آن را به زبان ساده + استراتژی فوری (۳ اقدام) تبدیل کن. خروجی باید JSON ساختاریافته مطابق schema پایین باشد. اگر داده ناقص بود، فیلد needsReview=true بگذار و حدس معقول با confidence بده.
[input]
{userInput}
[rules]
- خروجی سه سطح: moodLabel (one of: sunny, calm, cloudy, stormy, unknown), moodScore (0-100), narrative (30-120 words).
- ارائه 3 Actionable quick-wins (هر کدام ≤ 10 words) و 1 long-term suggestion (≤ 25 words).
- confidence: 0.0-1.0.
- تاریخ‌ها ISO8601.`,
        inputSchema: {
            "date": "2025-11-20",
            "journalText": "امروز جلسه خوبی داشتم ولی بعد از ظهر کمی احساس خستگی می‌کردم.",
            "sleepHours": 6.5,
            "habitCompletions": [{ "habitId": "نوشیدن آب", "done": true }, { "habitId": "ورزش", "done": false }],
            "activitiesSummary": "جلسه پروژه، کار روی تسک‌های فوری"
        },
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                moodLabel: { type: Type.STRING },
                moodScore: { type: Type.NUMBER },
                narrative: { type: Type.STRING },
                quickWins: { type: Type.ARRAY, items: { type: Type.STRING } },
                longTerm: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                needsReview: { type: Type.BOOLEAN }
            }
        }
    },
    {
        id: 'life-gps',
        title: 'GPS زندگی',
        description: 'یک برنامه عملی روزانه بر اساس اهداف و سطح انرژی شما می‌سازد.',
        icon: RouteIcon,
        model: 'gemini-2.5-flash',
        systemPrompt: `[ROLE=system]
تو یک مسیریاب عملی روزانه برای Benvis Life OS هستی. ورودی: userGoals, activeGoals, energyEstimate, calendarFreeSlots. تولید کن: یک Plan کوتاهِ قابل‌اجرا برای امروز شامل 3 بخش: Morning, Midday, Evening. هر بخش شامل 1-3 Task با زمان تخمینی (دقیقه)، priority و xpReward.
[input]
{userInput}
[rules]
- حداکثر 7 تسک در کل.
- هر تسک: {title, durationMin, priority(1-3), linkedGoalId|null, xp, start(HH:mm)}
- Provide brief rationale string (<=30 words).
- Output JSON.`,
        inputSchema: {
            "date": "2025-11-20",
            "activeGoals": [{ "id": "g1", "title": "یادگیری زبان جدید", "progress": 0.2 }],
            "energyEstimate": "medium",
            "freeSlots": [{ "start": "10:00", "end": "12:00" }, { "start": "15:00", "end": "17:30" }]
        },
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                date: { type: Type.STRING },
                plan: {
                    type: Type.ARRAY, items: {
                        type: Type.OBJECT, properties: {
                            section: { type: Type.STRING },
                            tasks: { type: Type.ARRAY, items: {
                                type: Type.OBJECT, properties: {
                                    title: { type: Type.STRING },
                                    durationMin: { type: Type.NUMBER },
                                    priority: { type: Type.NUMBER },
                                    linkedGoalId: { type: Type.STRING, nullable: true },
                                    xp: { type: Type.NUMBER },
                                    start: { type: Type.STRING }
                                }
                            }}
                        }
                    }
                },
                rationale: { type: Type.STRING }
            }
        }
    },
    {
        id: 'habit-doctor',
        title: 'پزشک عادت',
        description: 'علت‌های ریشه‌ای ترک عادت را تشخیص و برنامه اصلاحی ارائه می‌دهد.',
        icon: HabitsIcon,
        model: 'gemini-2.5-pro',
        systemPrompt: `[ROLE=system]
تو یک «پزشک عادت» هستی که علت‌های ریشه‌ای ترک عادت را با آنالیز داده‌های کاربر تشخیص می‌دهد و یک Plan اصلاحی 7 روزه می‌سازد. ورودی: habitHistory (آخرین 30 روز)، sleep, workloadEstimate, moodHistory.
[input]
{userInput}
[rules]
- خروجی شامل: diagnosis (max 2 sentences), top3 root causes (array), 7-day microPlan (each day: task, duration, trigger), metricsToTrack (3 items), confidence.
- هر پیشنهاد عملی کوتاه و قابل اجرا باشد.`,
        inputSchema: {
            "habitId": "h1",
            "habitTitle": "ورزش روزانه",
            "history": [
                { "date": "2025-11-19", "done": false },
                { "date": "2025-11-18", "done": false },
                { "date": "2025-11-17", "done": true }
            ],
            "sleepAvgHours": 6,
            "workload": "high",
            "recentMoodScores": [50, 45, 60]
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                diagnosis: { type: Type.STRING },
                rootCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
                microPlan: { type: Type.ARRAY, items: {
                    type: Type.OBJECT, properties: {
                        day: { type: Type.NUMBER },
                        task: { type: Type.STRING },
                        durationMin: { type: Type.NUMBER },
                        trigger: { type: Type.STRING }
                    }
                }},
                metricsToTrack: { type: Type.ARRAY, items: { type: Type.STRING } },
                confidence: { type: Type.NUMBER }
            }
        }
    },
    {
        id: 'health-score-360',
        title: 'نمره سلامت ۳۶۰',
        description: 'امتیاز سلامت شما را محاسبه و برنامه بهبود ۳۰ روزه ارائه می‌کند.',
        icon: HealthIcon,
        model: 'gemini-2.5-pro',
        systemPrompt: `[ROLE=system]
تو یک تحلیلگر Health Score هستی. ورودی: sleepHours, waterIntakeLiters, stepsCount, moodScores, cycleData (در صورت موجود)، nutritionSummary. تولید کن: healthScore (0-100) و componentBreakdown و 3 توصیه فوری و 1 برنامه 30 روزه برای بهبود.
[input]
{userInput}
[rules]
- healthScore محاسبه شده واضح توضیح داده شود.
- componentBreakdown: هر فاکتور سهم درصدی داشته باشد.
- سه اقدام فوری و یک roadmap 30 روزه.
- JSON خروجی.`,
        inputSchema: {
            "sleepHours": 6,
            "waterLiters": 1.5,
            "steps": 4500,
            "moodAvg": 65,
            "cyclePhase": "luteal"
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                healthScore: { type: Type.NUMBER },
                components: { type: Type.ARRAY, items: {
                    type: Type.OBJECT, properties: {
                        name: { type: Type.STRING },
                        weight: { type: Type.NUMBER },
                        score: { type: Type.NUMBER }
                    }
                }},
                quickActions: { type: Type.ARRAY, items: { type: Type.STRING } },
                "30dayPlan": { type: Type.STRING },
                confidence: { type: Type.NUMBER }
            }
        }
    },
    {
        id: 'smart-day-composer',
        title: 'سازنده روز هوشمند',
        description: 'بر اساس اولویت‌ها و انرژی شما، برنامه ساعتی روزتان را می‌چیند.',
        icon: CalendarIcon,
        model: 'gemini-2.5-flash',
        systemPrompt: `[ROLE=system]
تو یک Day Composer هستی که با توجه به userGoals, priorityTasks, energyProfile, calendarConstraints یک برنامهٔ ساعتی برای روز آینده می‌سازد. خروجی: schedule array با timeblocks (start,end,title,type:focus/break/meeting) و یک summary دلیل‌بندی.
[input]
{userInput}
[rules]
- حفظ بازه‌های آزاد، اولویت‌بندی بر اساس priorityTasks.
- پیشنهاد 2 تمرین کوتاه رفلکشن (<=5min).
- خروجی JSON با حداکثر 12 بلاک.`,
        inputSchema: {
            "date": "2025-11-21",
            "priorityTasks": [
                { "id": "t1", "title": "آماده‌سازی ارائه", "estMinutes": 90 },
                { "id": "t2", "title": "پاسخ به ایمیل‌ها", "estMinutes": 30 }
            ],
            "energyProfile": "earlyBird",
            "calendarBusy": [{ "start": "11:00", "end": "12:30" }]
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                date: { type: Type.STRING },
                schedule: { type: Type.ARRAY, items: {
                    type: Type.OBJECT, properties: {
                        start: { type: Type.STRING },
                        end: { type: Type.STRING },
                        title: { type: Type.STRING },
                        type: { type: Type.STRING }
                    }
                }},
                summary: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
            }
        }
    },
    {
        id: 'life-xp-engine',
        title: 'موتور امتیاز تجربه (XP)',
        description: 'برای فعالیت‌های شما XP محاسبه و قوانین تقویتی تولید می‌کند.',
        icon: BoltIcon,
        model: 'gemini-2.5-flash',
        systemPrompt: `[ROLE=system]
تو یک موتور تنظیم XP هستی. ورودی: taskHistory (هفته اخیر)، stressLevels, streaks. وظیفه: برای هر فعالیت XP محاسبه کن و قوانین تقویتی (boost rules) تولید کن. خروجی: xpAssignments array و rationale rules.
[input]
{userInput}
[rules]
- هر task خروجی: {taskId,xpAssigned,baseXP,boostReason|null}
- اگر stressAvg بالا باشد، apply small boost برای انگیزه.
- Provide a short policy (3 rules) for XP awarding.`,
        inputSchema: {
            "period": "2025-11-15_to_2025-11-21",
            "tasks": [
                { "id": "t1", "title": "تکمیل فصل ۱ کتاب", "completed": true, "effort": "medium" },
                { "id": "t2", "title": "ورزش صبحگاهی", "completed": true, "effort": "low" }
            ],
            "stressAvg": 7,
            "streaks": [{ "habitId": "h1", "length": 5 }]
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                xpAssignments: { type: Type.ARRAY, items: {
                    type: Type.OBJECT, properties: {
                        taskId: { type: Type.STRING },
                        xpAssigned: { type: Type.NUMBER },
                        baseXP: { type: Type.NUMBER },
                        boostReason: { type: Type.STRING, nullable: true }
                    }
                }},
                policy: { type: Type.ARRAY, items: { type: Type.STRING } },
                confidence: { type: Type.NUMBER }
            }
        }
    },
    {
        id: 'ai-money-guard',
        title: 'نگهبان پول هوشمند',
        description: 'هزینه‌ها را تحلیل، نوسانات را شناسایی و پیشنهاد صرفه‌جویی می‌دهد.',
        icon: FinanceIcon,
        model: 'gemini-2.5-pro',
        systemPrompt: `[ROLE=system]
تو یک تحلیلگر مالی برای Benvis Life OS هستی. ورودی: last60DaysTransactions, budgets. وظیفه: پیدا کردن categories با افزایش نوسان یا افزایش مصرف >20% نسبت به میانگین و تولید 3 actionable suggestions هر کدام با تاثیر برآوردی.
[input]
{userInput}
[rules]
- detect spikes (>=20% vs avg) یا سری هزینه‌های رو به رشد.
- هر هشدار شامل: category, deltaPercent, suggestedAction (3)، estimatedSavingPerMonth.
- JSON خروجی.`,
        inputSchema: {
            "transactions": [
                { "id": "t1", "date": "2025-11-18", "amount": 50000, "category": "غذا", "account": "a1" },
                { "id": "t2", "date": "2025-10-15", "amount": 30000, "category": "غذا", "account": "a1" }
            ],
            "budgets": { "غذا": 100000, "سرگرمی": 50000 }
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                alerts: { type: Type.ARRAY, items: {
                    type: Type.OBJECT, properties: {
                        category: { type: Type.STRING },
                        deltaPercent: { type: Type.NUMBER },
                        suggestedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        estimatedSavingPerMonth: { type: Type.NUMBER }
                    }
                }},
                confidence: { type: Type.NUMBER }
            }
        }
    },
    {
        id: 'time-sensei',
        title: 'استاد زمان',
        description: 'نحوه گذراندن زمان را تحلیل و راهکار بهینه‌سازی پیشنهاد می‌دهد.',
        icon: ClockIcon,
        model: 'gemini-2.5-pro',
        systemPrompt: `[ROLE=system]
تو یک تحلیلگر زمان و مربی بهینه‌سازی تقویم هستی. ورودی: timeBlocks (روزانه/هفتگی)، productivityScores، goals. خروجی: timeAudit summary، top3 time-sinks، 3 recommended schedule changes (with expected benefit).
[input]
{userInput}
[rules]
- compute totalTimePerActivity, identify top time-sinks (>15% total).
- Suggest consolidation (e.g., batching), two-hour chunks برای تمرکز.
- Output JSON.`,
        inputSchema: {
            "timeBlocks": [
                { "date": "2025-11-19", "start": "09:00", "end": "11:00", "activity": "کار عمیق", "productivity": 9 },
                { "date": "2025-11-19", "start": "11:00", "end": "12:00", "activity": "شبکه‌های اجتماعی", "productivity": 2 }
            ],
            "productivityAvg": 6.5
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                audit: { type: Type.ARRAY, items: {
                    type: Type.OBJECT, properties: {
                        activity: { type: Type.STRING },
                        totalMinutes: { type: Type.NUMBER },
                        percent: { type: Type.NUMBER }
                    }
                }},
                topSinks: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommendations: { type: Type.ARRAY, items: {
                    type: Type.OBJECT, properties: {
                        change: { type: Type.STRING },
                        expectedBenefit: { type: Type.STRING }
                    }
                }},
                confidence: { type: Type.NUMBER }
            }
        }
    },
    {
        id: 'mini-rituals',
        title: 'سازنده آیین‌های کوچک',
        description: 'بر اساس مود و هدف، آیین‌های ۱-۳ دقیقه‌ای پیشنهاد می‌دهد.',
        icon: SparklesIcon,
        model: 'gemini-2.5-flash',
        systemPrompt: `[ROLE=system]
تو یک سازندهٔ Ritual هستی که بر اساس mood, goals, timeOfDay آیین‌های 1-3 دقیقه‌ای پیشنهاد می‌دهد. خروجی: 3 rituals با نام، دستورالعمل 1-2 خطی، trigger event، expectedEffect.
[input]
{userInput}
[rules]
- هر ritual ≤ 45 words.
- provide quick metric to track (e.g., breathe 6x, drink 1 glass water).
- JSON output.`,
        inputSchema: {
            "timeOfDay": "morning",
            "mood": "cloudy",
            "goalFocus": "focus"
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                rituals: { type: Type.ARRAY, items: {
                    type: Type.OBJECT, properties: {
                        name: { type: Type.STRING },
                        instructions: { type: Type.STRING },
                        trigger: { type: Type.STRING },
                        effect: { type: Type.STRING },
                        trackMetric: { type: Type.STRING }
                    }
                }},
                confidence: { type: Type.NUMBER }
            }
        }
    },
    {
        id: 'identity-builder',
        title: 'سازنده هویت',
        description: 'به شما در ساختن یک هویت جدید با عادت‌ها و مسیر پیشرفت کمک می‌کند.',
        icon: UserIcon,
        model: 'gemini-2.5-pro',
        systemPrompt: `[ROLE=system]
تو یک Identity Builder هستی. ورودی: userPreferences, selectedIdentityHint (e.g., "writer","runner"). خروجی: identityProfile شامل keyTraits, starterHabits (5)، xpPath, UIThemeSuggestion (colors/emoji tags).
[input]
{userInput}
[rules]
- produce 5 starterHabits with micro-steps.
- suggest 3 UI changes (e.g., accent color, dashboard widget).
- output JSON.`,
        inputSchema: {
            "selectedIdentity": "writer"
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                identity: { type: Type.STRING },
                traits: { type: Type.ARRAY, items: { type: Type.STRING } },
                starterHabits: { type: Type.ARRAY, items: {
                    type: Type.OBJECT, properties: {
                        title: { type: Type.STRING },
                        microStep: { type: Type.STRING },
                        frequency: { type: Type.STRING }
                    }
                }},
                xpPath: { type: Type.STRING },
                uiSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        }
    },
    {
        id: 'happiness-archive',
        title: 'آرشیو خوشبختی',
        description: 'از یادداشت‌های شما، لحظات مثبت را استخراج و آلبوم می‌سازد.',
        icon: StarIcon,
        model: 'gemini-2.5-pro',
        systemPrompt: `[ROLE=system]
تو یک curator خاطرات خوشحالی هستی. ورودی: journalEntries (with tags), photoCaptions (optional). خروجی: a curated album structure: title, topMoments (5) each with caption (<=20 words), shareableSummary (<=60 words).
[input]
{userInput}
[rules]
- pick top 5 positive entries based on tags/positiveSentiment.
- generate concise captions and an overall shareable summary.
- output JSON.`,
        inputSchema: {
            "period": "2025-11",
            "journalEntries": [
                { "date": "2025-11-05", "text": "امروز پروژه رو تموم کردم و خیلی حس خوبی دارم.", "tags": ["happy", "achievement"] },
                { "date": "2025-11-12", "text": "با دوستم رفتم کافه و خیلی خوش گذشت.", "tags": ["social"] }
            ]
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                albumTitle: { type: Type.STRING },
                topMoments: { type: Type.ARRAY, items: {
                    type: Type.OBJECT, properties: {
                        date: { type: Type.STRING },
                        caption: { type: Type.STRING }
                    }
                }},
                shareableSummary: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
            }
        }
    },
    {
        id: 'ai-sleep-partner',
        title: 'همیار خواب هوشمند',
        description: 'کیفیت خواب شما را تحلیل و روتین شبانه شخصی‌سازی شده ارائه می‌دهد.',
        icon: MoonIcon,
        model: 'gemini-2.5-flash',
        systemPrompt: `[ROLE=system]
تو یک coach خواب هستی. ورودی: last14Nights (hours,sleepLatency,wakeCount), caffeineIntakeToday, preSleepScreenTimeMin. خروجی: sleepScore(0-100), 3 tailored tips, nightlyRoutine(<=5 steps).
[input]
{userInput}
[rules]
- use recent trends (last7days) to compute score.
- tips must be specific (e.g., "no caffeine after 15:00").
- output JSON.`,
        inputSchema: {
            "lastNights": [
                { "date": "2025-11-19", "hours": 6.5, "latency": 25, "wakeCount": 2 },
                { "date": "2025-11-18", "hours": 7.8, "latency": 10, "wakeCount": 0 }
            ],
            "caffeineMg": 200,
            "screenTimeMin": 60
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                sleepScore: { type: Type.NUMBER },
                tips: { type: Type.ARRAY, items: { type: Type.STRING } },
                nightRoutine: { type: Type.ARRAY, items: { type: Type.STRING } },
                confidence: { type: Type.NUMBER }
            }
        }
    },
    {
        id: 'ai-challenge-maker',
        title: 'چالش‌ساز هوشمند',
        description: 'بر اساس اهداف شما، چالش‌های شخصی‌سازی شده طراحی می‌کند.',
        icon: FlagIcon,
        model: 'gemini-2.5-flash',
        systemPrompt: `[ROLE=system]
تو یک Challenge Generator هستی. ورودی: userGoals, difficulty("easy|medium|hard"), durationDays. خروجی: challenge object with rules, dailyTasks, successCriteria, xpReward.
[input]
{userInput}
[rules]
- dailyTasks array length = durationDays (summarized if repetitive).
- specify successCriteria (e.g., complete 5/7 days).
- xpReward numeric.`,
        inputSchema: {
            "goal": "improve_fitness",
            "difficulty": "easy",
            "durationDays": 7
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                challengeTitle: { type: Type.STRING },
                durationDays: { type: Type.NUMBER },
                dailyTasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                successCriteria: { type: Type.STRING },
                xpReward: { type: Type.NUMBER },
                confidence: { type: Type.NUMBER }
            }
        }
    },
    {
        id: 'life-map',
        title: 'نقشه زندگی',
        description: 'یک گراف از ارتباط بین اهداف، عادت‌ها و جنبه‌های زندگی شما می‌سازد.',
        icon: ShareIcon,
        model: 'gemini-2.5-pro',
        systemPrompt: `[ROLE=system]
تو یک گراف‌ساز زندگی هستی. ورودی: goals, habits, accounts, healthMetrics. خروجی: nodes[] و edges[] برای رندر یک گراف (label, type, weight). همچنین summary of keyClusters.
[input]
{userInput}
[rules]
- node types: goal|habit|finance|health
- edge: {from,to,relation,weight}
- provide cluster labels and 3 insights.`,
        inputSchema: {
            "goals": [{ "id": "g1", "title": "یادگیری زبان" }],
            "habits": [{ "id": "h1", "title": "مطالعه روزانه" }]
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                nodes: { type: Type.ARRAY, items: {
                    type: Type.OBJECT, properties: {
                        id: { type: Type.STRING },
                        label: { type: Type.STRING },
                        type: { type: Type.STRING }
                    }
                }},
                edges: { type: Type.ARRAY, items: {
                    type: Type.OBJECT, properties: {
                        from: { type: Type.STRING },
                        to: { type: Type.STRING },
                        relation: { type: Type.STRING },
                        weight: { type: Type.NUMBER }
                    }
                }},
                clusters: { type: Type.ARRAY, items: { type: Type.STRING } },
                insights: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        }
    },
    {
        id: 'reflection-coach',
        title: 'مربی تأمل',
        description: 'بر اساس روز گذشته شما، سؤالات بازتابی برای ژورنال‌نویسی می‌سازد.',
        icon: PencilIcon,
        model: 'gemini-2.5-flash',
        systemPrompt: `[ROLE=system]
تو یک Reflection Coach هستی که با تحلیل روزهای گذشته ۳ سؤال بازتابی مخصوص امروز تولید می‌کند و برای هر سؤال راهنمای پاسخ‌دادن 1-2 جمله‌ای می‌دهد.
[input]
{userInput}
[rules]
- produce 3 questions, each with a short promptExample and expectedLength (words).
- provide 1 suggested journaling timer in minutes.`,
        inputSchema: {
            "recentActivities": ["جلسه پروژه", "ورزش"],
            "moodToday": "calm"
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                questions: { type: Type.ARRAY, items: {
                    type: Type.OBJECT, properties: {
                        q: { type: Type.STRING },
                        promptExample: { type: Type.STRING },
                        expectedLengthWords: { type: Type.NUMBER }
                    }
                }},
                timerMinutes: { type: Type.NUMBER },
                confidence: { type: Type.NUMBER }
            }
        }
    },
    {
        id: 'ai-decision-helper',
        title: 'دستیار تصمیم‌گیری',
        description: 'گزینه‌ها را بر اساس اولویت‌های شما امتیازبندی و بهترین را پیشنهاد می‌دهد.',
        icon: ScaleIcon,
        model: 'gemini-2.5-flash',
        systemPrompt: `[ROLE=system]
تو یک Decision Helper هستی. ورودی: optionA {desc, timeCost, monetaryCost, emotionalImpactScore}, optionB similarly, userPriorities (["time","money","wellbeing"]). وظیفه: scoring (0-100) هر گزینه بر اساس اولویت‌ها، recommendation و short rationale.
[input]
{userInput}
[rules]
- compute weightedScore for each option.
- produce decision: choose A|B|defer and short action (<=20 words).
- JSON output.`,
        inputSchema: {
            "optionA": { "desc": "شرکت در دوره آنلاین", "timeMins": 120, "money": 200, "emotionalImpact": 3 },
            "optionB": { "desc": "مطالعه کتاب مرتبط", "timeMins": 30, "money": 50, "emotionalImpact": 7 },
            "priorities": ["time", "wellbeing", "money"]
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                scores: { type: Type.OBJECT, properties: { "A": { type: Type.NUMBER }, "B": { type: Type.NUMBER } } },
                decision: { type: Type.STRING },
                rationale: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
            }
        }
    },
    {
        id: 'life-pattern-detector',
        title: 'یابنده الگوهای زندگی',
        description: 'الگوهای پنهان در رفتار شما را شناسایی و آزمایش پیشنهاد می‌دهد.',
        icon: MagnifyingGlassIcon,
        model: 'gemini-2.5-pro',
        systemPrompt: `[ROLE=system]
تو یک Pattern Detector هستی. ورودی: multi-week data (sleep, mood, spend, habits). خروجی: detectedPatterns[] هر کدام: patternDescription, correlationStrength (0-1), suggestedExperiment (A/B test) برای اعتبارسنجی.
[input]
{userInput}
[rules]
- return up to 5 strongest patterns.
- suggest a small experiment (7-14 days) برای هر pattern.
- JSON output.`,
        inputSchema: {
            "weeks": [
                { "weekStart": "2025-11-03", "sleepAvg": 6, "spendAvg": 300 },
                { "weekStart": "2025-11-10", "sleepAvg": 7.5, "spendAvg": 150 }
            ]
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                patterns: { type: Type.ARRAY, items: {
                    type: Type.OBJECT, properties: {
                        description: { type: Type.STRING },
                        correlation: { type: Type.NUMBER },
                        experiment: { type: Type.STRING }
                    }
                }},
                confidence: { type: Type.NUMBER }
            }
        }
    },
    {
        id: 'mind-detox',
        title: 'سم‌زدایی ذهن',
        description: 'بر اساس سطح استرس شما، یک روتین آرام‌سازی شخصی می‌سازد.',
        icon: BrainIcon,
        model: 'gemini-2.5-flash',
        systemPrompt: `[ROLE=system]
تو یک Mind Detox guide هستی. ورودی: todaysStressLevel(0-10), keyThoughts (list), timeAvailableMinutes. خروجی: 1 detoxRoutine (steps up to timeAvailable), journalingPrompt, breathingExercise (name+instructions).
[input]
{userInput}
[rules]
- total routineTime <= timeAvailable
- breathing exercise <=3 steps، قابل انجام بدون ابزار.
- JSON output.`,
        inputSchema: {
            "stressLevel": 8,
            "keyThoughts": ["نگرانی درباره جلسه فردا", "حجم زیاد کارها"],
            "timeAvailable": 10
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                routine: { type: Type.ARRAY, items: { type: Type.STRING } },
                journalingPrompt: { type: Type.STRING },
                breathingExercise: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
            }
        }
    },
    {
        id: 'ai-emotion-classifier',
        title: 'طبقه‌بند احساسات',
        description: 'احساسات را از روی متن شما شناسایی و راهکار فوری ارائه می‌دهد.',
        icon: FaceSmileIcon,
        model: 'gemini-2.5-flash',
        systemPrompt: `[ROLE=system]
تو یک Emotion Classifier هستی. ورودی: textSnippet (≤300 words). وظیفه: classify emotion (joy,sadness,anger,fear,neutral,mixed), intensity (0-1)، suggestedAction (one immediate, one reflective).
[input]
{userInput}
[rules]
- classification single-label یا mixed (array) اگر قوی باشند.
- suggestedAction باید عملی و ≤ 12 words.
- Output JSON.`,
        inputSchema: {
            "text": "از اینکه نتونستم پروژه رو به موقع تحویل بدم خیلی عصبانی و ناامیدم."
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                emotion: { type: Type.ARRAY, items: { type: Type.STRING } },
                intensity: { type: Type.NUMBER },
                suggestedAction: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
            }
        }
    },
    {
        id: 'life-strategy-ai',
        title: 'استراتژیست زندگی',
        description: 'عملکرد ماه گذشته شما را تحلیل و استراتژی ماه آینده را تدوین می‌کند.',
        icon: TargetIcon,
        model: 'gemini-2.5-pro',
        systemPrompt: `[ROLE=system]
تو یک Life Strategist هستی. ورودی: pastMonthSummary (goalsProgress, majorEvents, timeUse), userAmbitionLevel ("maintain|grow|transform"). خروجی: monthlyStrategy شامل focusTheme, 3 objectives each with 3 keyResults, 3 actions, 2 risks, and an evaluationPlan (how to measure).
[input]
{userInput}
[rules]
- objectives concise (<=10 words).
- keyResults measurable (numbers/dates).
- evaluationPlan: weeklyCheckpoints (days).
- Output JSON.`,
        inputSchema: {
            "month": "2025-11",
            "pastMonthSummary": {
                "goalsProgress": [{ "id": "g1", "progress": 0.4 }],
                "majorEvents": ["شروع پروژه جدید در کار"],
                "timeUse": "بیشتر زمان صرف کار شد، زمان کمی برای تفریح بود."
            },
            "ambition": "grow"
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                focusTheme: { type: Type.STRING },
                objectives: { type: Type.ARRAY, items: {
                    type: Type.OBJECT, properties: {
                        title: { type: Type.STRING },
                        keyResults: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }},
                actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                risks: { type: Type.ARRAY, items: { type: Type.STRING } },
                evaluationPlan: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
            }
        }
    },
    {
        id: 'calm-sos',
        title: 'SOS آرامش',
        description: 'یک تمرین فوری برای کاهش استرس و ایجاد آرامش در لحظات بحرانی.',
        icon: LeafIcon,
        model: 'gemini-2.5-flash',
        systemPrompt: `You are an AI providing immediate emotional stabilization in a crisis.
        Based on the user's feeling, generate a 90-second grounding script, one simple action step, and one supportive message.
        The response must be in Persian and a valid JSON object.
        
        [input]
        {userInput}`,
        inputSchema: {
            "feeling": "احساس می‌کنم غرق شده‌ام و استرس زیادی دارم"
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                groundingScript: { type: Type.STRING },
                actionStep: { type: Type.STRING },
                supportMessage: { type: Type.STRING }
            }
        }
    },
    {
        id: 'skill-builder',
        title: 'مربی میکرو-دوره',
        description: 'برای یادگیری یک مهارت جدید، یک نقشه راه و دوره آموزشی کوتاه ایجاد می‌کند.',
        icon: EducationIcon,
        model: 'gemini-2.5-pro',
        systemPrompt: `You are an AI course designer creating 7–14 day micro-learning paths based on a single user goal.
        Given a goal (e.g., "build reading habit"), generate a 10-day micro-course.
        Each day must include:
        - skill focus
        - micro-lesson (<100 words)
        - challenge
        - reflection question
        The response MUST be in Persian and a valid JSON object matching the schema.
        
        [input]
        {userInput}`,
        inputSchema: {
            "goal": "یادگیری اصول اولیه سرمایه‌گذاری",
            "durationDays": 10
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                courseTitle: { type: Type.STRING },
                days: {
                    type: Type.ARRAY, items: {
                        type: Type.OBJECT, properties: {
                            day: { type: Type.NUMBER },
                            focus: { type: Type.STRING },
                            lesson: { type: Type.STRING },
                            challenge: { type: Type.STRING },
                            reflection: { type: Type.STRING }
                        }
                    }
                }
            }
        }
    },
    {
        id: 'privacy-advisor',
        title: 'مشاور حریم خصوصی',
        description: 'یک طرح امنیتی برای ذخیره‌سازی امن داده‌های حساس شما ایجاد می‌کند.',
        icon: LockClosedIcon,
        model: 'gemini-2.5-flash',
        systemPrompt: `You generate encryption policies and secure storage recommendations for sensitive local data in a PWA environment.
    Create a security plan for storing journals, finance logs, and health data.
    The output MUST include: encryption method, key rotation logic, backup strategy, and risk analysis.
    The response must be a valid JSON object and in Persian.
    
    [input]
    {userInput}`,
        inputSchema: {
            "dataTypes": ["journals", "finance", "health"]
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                encryptionMethod: { type: Type.STRING },
                keyManagement: { type: Type.STRING },
                backupPlan: { type: Type.STRING },
                riskNotes: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        }
    },
    {
        id: 'financial-autopilot',
        title: 'خلبان خودکار مالی',
        description: 'قوانین خودکار ساده برای مدیریت پول شما بر اساس ساختار IF-THEN ایجاد می‌کند.',
        icon: FinanceIcon,
        model: 'gemini-2.5-flash',
        systemPrompt: `You create simple automation rules for money management using the IF–THEN structure.
    Generate 3 personalized automations based on user financial data.
    The response must be a valid JSON object and in Persian.

    [input]
    {userInput}`,
        inputSchema: {
            "monthlyIncome": 5000000,
            "savingsGoal": 1000000,
            "budgets": { "diningOut": 500000 }
        },
        responseSchema: {
            type: Type.OBJECT, properties: {
                rules: {
                    type: Type.ARRAY, items: {
                        type: Type.OBJECT, properties: {
                            "if": { type: Type.STRING },
                            "then": { type: Type.STRING },
                            "reason": { type: Type.STRING }
                        }
                    }
                }
            }
        }
    }
];