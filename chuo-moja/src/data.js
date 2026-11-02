/* ---------- Kenyan universities: CUE chartered list (35 public, 32 private), short names for display ---------- */
const UNIS = [
  ['University of Nairobi','UoN','pub'],['Moi University','Moi','pub'],['Kenyatta University','KU','pub'],['Egerton University','Egerton','pub'],
  ['Jomo Kenyatta University of Agriculture and Technology','JKUAT','pub'],['Maseno University','Maseno','pub'],
  ['Masinde Muliro University of Science and Technology','MMUST','pub'],['Dedan Kimathi University of Technology','DeKUT','pub'],
  ['Chuka University','Chuka','pub'],['Technical University of Kenya','TUK','pub'],['Technical University of Mombasa','TUM','pub'],
  ['Pwani University','Pwani','pub'],['Kisii University','Kisii Uni','pub'],['University of Eldoret','UoEld','pub'],
  ['Maasai Mara University','Maasai Mara','pub'],['Jaramogi Oginga Odinga University of Science and Technology','JOOUST','pub'],
  ['Laikipia University','Laikipia','pub'],['South Eastern Kenya University','SEKU','pub'],['Meru University of Science and Technology','MUST','pub'],
  ['Multimedia University of Kenya','MMU','pub'],['University of Kabianga','Kabianga','pub'],['Karatina University','Karatina','pub'],
  ['Kibabii University','Kibabii','pub'],['Rongo University','Rongo','pub'],['The Co-operative University of Kenya','Co-op Uni','pub'],
  ['Taita Taveta University','TTU','pub'],["Murang'a University of Technology",'MUT','pub'],['University of Embu','Embu Uni','pub'],
  ['Machakos University','Machakos Uni','pub'],['Kirinyaga University','Kirinyaga Uni','pub'],['Garissa University','Garissa Uni','pub'],
  ['Alupe University','Alupe','pub'],['Kaimosi Friends University','Kaimosi','pub'],['Tom Mboya University','Tom Mboya','pub'],['Tharaka University','Tharaka','pub'],
  ['University of Eastern Africa, Baraton','Baraton','pri'],['Catholic University of Eastern Africa','CUEA','pri'],['Daystar University','Daystar','pri'],
  ['Scott Christian University','Scott Christian','pri'],['United States International University','USIU-A','pri'],['Africa Nazarene University','ANU','pri'],
  ['Kenya Methodist University','KeMU','pri'],["St. Paul's University","St Paul's",'pri'],['Pan Africa Christian University','PAC','pri'],
  ['Strathmore University','Strathmore','pri'],['Kabarak University','Kabarak','pri'],['Mount Kenya University','MKU','pri'],
  ['Africa International University','AIU','pri'],['Kenya Highlands Evangelical University','KHEU','pri'],['Great Lakes University of Kisumu','GLUK','pri'],
  ['KCA University','KCA','pri'],['Adventist University of Africa','AUA','pri'],['KAG EAST University','KAG EAST','pri'],['Umma University','Umma','pri'],
  ['Presbyterian University of East Africa','PUEA','pri'],['Aga Khan University','AKU','pri'],["Kiriri Women's University of Science and Technology",'Kiriri','pri'],
  ['The East African University','EAU','pri'],['Zetech University','Zetech','pri'],['Lukenya University','Lukenya','pri'],['Management University of Africa','MUA','pri'],
  ['Tangaza University','Tangaza','pri'],['Islamic University of Kenya','IUK','pri'],['Riara University','Riara','pri'],['Uzima University','Uzima','pri'],
  ['Gretsa University','Gretsa','pri'],['Amref International University','Amref Uni','pri']
].map(u=>({name:u[0],s:u[1],kind:u[2]}));
const uniShort = n => (UNIS.find(u=>u.name===n)||{s:n}).s;

/* towns where universities sit (only towns we are sure of); lon/lat drive the map */
const TOWNS = [
  {k:'nairobi',n:'Nairobi & surrounds',lon:36.82,lat:-1.29,u:['UoN','KU','TUK','MMU','Co-op Uni','Strathmore','USIU-A','CUEA','KCA','Riara','AKU','Tangaza','MUA','Kiriri','Daystar','ANU','St Paul\'s','PAC','AIU','AUA','KAG EAST','Umma','PUEA','EAU','IUK','Amref Uni']},
  {k:'juja',n:'Juja & Thika',lon:37.05,lat:-1.05,u:['JKUAT','MKU','Gretsa','Zetech']},
  {k:'machakos',n:'Machakos',lon:37.26,lat:-1.52,u:['Machakos Uni','Scott Christian','Lukenya']},
  {k:'kitui',n:'Kitui',lon:38.01,lat:-1.37,u:['SEKU']},
  {k:'embu',n:'Embu',lon:37.45,lat:-0.53,u:['Embu Uni']},
  {k:'meru',n:'Meru & Chuka',lon:37.65,lat:0.05,u:['MUST','Chuka','Tharaka','KeMU']},
  {k:'nyeri',n:'Nyeri & Karatina',lon:36.95,lat:-0.42,u:['DeKUT','Karatina']},
  {k:'muranga',n:"Murang'a & Kirinyaga",lon:37.2,lat:-0.65,u:['MUT','Kirinyaga Uni']},
  {k:'nakuru',n:'Nakuru & Njoro',lon:36.07,lat:-0.3,u:['Egerton','Kabarak']},
  {k:'nyahururu',n:'Nyahururu',lon:36.37,lat:0.04,u:['Laikipia']},
  {k:'kericho',n:'Kericho',lon:35.28,lat:-0.37,u:['Kabianga','KHEU']},
  {k:'eldoret',n:'Eldoret',lon:35.27,lat:0.52,u:['Moi','UoEld','Baraton']},
  {k:'bungoma',n:'Bungoma & Busia',lon:34.4,lat:0.55,u:['Kibabii','Alupe']},
  {k:'kakamega',n:'Kakamega & Vihiga',lon:34.75,lat:0.28,u:['MMUST','Kaimosi']},
  {k:'kisumu',n:'Kisumu region',lon:34.7,lat:-0.1,u:['Maseno','JOOUST','GLUK','Uzima']},
  {k:'kisii',n:'Kisii, Rongo & Homa Bay',lon:34.6,lat:-0.7,u:['Kisii Uni','Rongo','Tom Mboya']},
  {k:'narok',n:'Narok',lon:35.87,lat:-1.08,u:['Maasai Mara']},
  {k:'garissa',n:'Garissa',lon:39.64,lat:-0.45,u:['Garissa Uni']},
  {k:'voi',n:'Voi',lon:38.56,lat:-3.4,u:['TTU']},
  {k:'mombasa',n:'Mombasa',lon:39.67,lat:-4.05,u:['TUM']},
  {k:'kilifi',n:'Kilifi',lon:39.85,lat:-3.63,u:['Pwani']}
];
/* schematic outline of Kenya (lon,lat). Approximate on purpose: it is a map for orientation, not a survey. */
const KENYA = [[33.93,0.10],[34.10,0.46],[34.55,1.10],[34.98,1.60],[35.00,2.00],[34.60,2.90],[34.40,3.50],[34.00,4.22],[34.40,4.62],[35.20,5.00],[35.95,4.62],[36.85,4.45],[37.9,3.8],[38.1,3.6],[39.05,3.52],[39.78,3.68],[40.35,4.0],[40.99,4.18],[41.6,3.98],[41.9,3.98],[41.0,2.8],[40.98,-0.85],[41.56,-1.66],[41.3,-1.9],[40.85,-2.35],[40.2,-2.85],[39.9,-3.4],[39.65,-4.05],[39.2,-4.68],[38.5,-4.1],[37.65,-3.1],[36.6,-2.9],[35.8,-2.3],[35.2,-1.85],[34.55,-1.35],[34.05,-1.0],[33.95,-0.4]];

/* ---------- Spaces ---------- */
const HUBS = [
  {id:'calc1',name:'Calculus I',fac:'Mathematics',members:4820,unis:31,hot:'CAT 1 revision this week'},
  {id:'micro',name:'Microeconomics',fac:'Economics',members:3910,unis:27,hot:'Past-paper walkthrough Sunday'},
  {id:'anat',name:'Anatomy & Physiology',fac:'Health Sciences',members:3350,unis:19,hot:'Lab practical tips'},
  {id:'dsa',name:'Data Structures & Algorithms',fac:'Computing',members:2980,unis:24,hot:'Weekly coding clinic'},
  {id:'facc',name:'Financial Accounting',fac:'Commerce',members:4410,unis:33,hot:'Ledger and trial balance Q&A'},
  {id:'conlaw',name:'Constitutional Law',fac:'Law',members:1720,unis:12,hot:'Moot court prep thread'},
  {id:'orgchem',name:'Organic Chemistry',fac:'Chemistry',members:1540,unis:17,hot:'Reaction mechanism drills'},
  {id:'comm',name:'Communication Skills',fac:'Common unit',members:6200,unis:38,hot:'Report-writing help'},
  {id:'intprog',name:'Introduction to Programming',fac:'Computing',members:5130,unis:36,hot:'Beginner Python circle'},
  {id:'stats',name:'Statistics for Research',fac:'Research methods',members:2760,unis:29,hot:'Proposal and SPSS help'},
  {id:'entre',name:'Entrepreneurship',fac:'Common unit',members:3480,unis:34,hot:'Business plan swaps'},
  {id:'engmath',name:'Engineering Mathematics',fac:'Engineering',members:2290,unis:15,hot:'Differential equations clinic'},
  {id:'soil',name:'Soil Science',fac:'Agriculture',members:1180,unis:13,hot:'Field practical photos'},
  {id:'nurs',name:'Nursing Fundamentals',fac:'Nursing',members:2470,unis:21,hot:'Clinical skills checklist'}
].map(h=>({...h,type:'unit',desc:`${h.fac} · students at ${h.unis} universities share notes, questions and study groups here.`}));
const INTERESTS = [
  {id:'i-hack',name:'Hackathons & Code',desc:'Find teammates, share events, review each other\'s projects.',members:5200,unis:40},
  {id:'i-debate',name:'Debate & Moot Court',desc:'Practice rounds across universities, judges and tips.',members:1650,unis:22},
  {id:'i-agri',name:'Agribusiness & Farming',desc:'From dairy to horticulture: ideas, markets and inputs.',members:2130,unis:26},
  {id:'i-start',name:'Campus Startups',desc:'Pitch ideas, get feedback, find co-founders.',members:3860,unis:35},
  {id:'i-mind',name:'Mind & Wellbeing',desc:'Peer support, stress before exams, and where to find counselling.',members:2740,unis:37},
  {id:'i-sport',name:'Sports & Campus Leagues',desc:'Football, volleyball, athletics: fixtures and friendly matches.',members:4480,unis:41},
  {id:'i-media',name:'Creatives & Media',desc:'Photography, film, design, music and poetry.',members:2290,unis:30},
  {id:'i-green',name:'Green Campus & Climate',desc:'Tree planting, recycling drives and climate research.',members:1390,unis:25}
].map(x=>({...x,type:'interest'}));
const GUILDS = [
  {id:'g-lib',name:'Librarians',desc:'Open-access tools, cataloguing, e-resource deals and inter-library loans.',members:640,unis:46,who:'staff'},
  {id:'g-ict',name:'ICT Officers',desc:'Network fixes, portal tips, security alerts and procurement advice.',members:910,unis:52,who:'staff'},
  {id:'g-reg',name:'Registry & Admissions',desc:'Compare processes for registration, transcripts and graduation.',members:780,unis:49,who:'staff'},
  {id:'g-fin',name:'Finance & Bursaries',desc:'Fee structures, HELB reconciliation, audit prep.',members:560,unis:44,who:'staff'},
  {id:'g-host',name:'Hostels & Catering',desc:'Accommodation standards, menus, suppliers and welfare.',members:830,unis:47,who:'staff'},
  {id:'g-sec',name:'Security & Safety',desc:'Campus safety practice, drills and incident learning.',members:470,unis:40,who:'staff'},
  {id:'g-res',name:'Research Circle',desc:'Co-authors, grant calls and supervision advice for lecturers.',members:1320,unis:55,who:'lecturer'},
  {id:'g-wel',name:'Welfare & Mentorship',desc:'Peer mentoring, wellbeing and career growth for support staff.',members:390,unis:33,who:'staff'},
  {id:'g-exam',name:'Exams Officers',desc:'Exam timetables, invigilation, moderation and results processing.',members:420,unis:38,who:'staff'}
].map(x=>({...x,type:'guild'}));
const COUNTIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Uasin Gishu','Kakamega','Kiambu','Machakos','Nyeri','Kisii'].map(n=>({id:'c-'+n.toLowerCase().replace(/\s/g,''),name:n+' County',
  desc:`Students, lecturers and staff who call ${n} home or study there, whichever university they are at.`,members:900+n.length*173,unis:12+n.length,type:'county'}));
const ALL_SPACES = [...HUBS,...INTERESTS,...GUILDS,...COUNTIES];

/* ---------- Open Lines (calls). day = offset from today ---------- */
const LINES = [
  {id:'l1',day:0,h:20,m:0,dur:60,title:'CAT survival: Calculus I',host:'Achieng O.',role:'student',uni:'Maseno',lang:'EN / Sheng',tags:['Calculus I','CAT prep'],going:86},
  {id:'l2',day:1,h:19,m:0,dur:45,title:"Lecturers' lounge: supervising postgraduate students",host:'Dr. Mwangi K.',role:'lecturer',uni:'Egerton',lang:'EN',tags:['Research','Supervision'],going:41},
  {id:'l3',day:2,h:17,m:0,dur:40,title:'Librarians: open-access tools that cost nothing',host:'Grace W.',role:'staff',uni:'KU',lang:'EN',tags:['Library','Guild'],going:58},
  {id:'l4',day:4,h:20,m:0,dur:60,title:'Career talk: breaking into banking',host:'Otieno B.',role:'student',uni:'UoN',lang:'EN',tags:['Careers','Commerce'],going:212},
  {id:'l5',day:5,h:10,m:0,dur:45,title:'Mazungumzo ya Kiswahili: hadithi na mashairi',host:'Mwanaisha H.',role:'lecturer',uni:'Pwani',lang:'Kiswahili',tags:['Kiswahili','Creatives'],going:73},
  {id:'l6',day:6,h:16,m:0,dur:60,title:'Startup ideas open mic',host:'Kiprono L.',role:'student',uni:'Moi',lang:'EN / Sheng',tags:['Startups','Pitching'],going:134},
  {id:'l7',day:3,h:18,m:30,dur:45,title:'ICT Officers: lock down your campus Wi-Fi',host:'Brian M.',role:'staff',uni:'JKUAT',lang:'EN',tags:['ICT','Guild'],going:67}
];

/* ---------- Opportunities (example listings; deadlines are days from today) ---------- */
const OPPS = [
  {id:'o1',type:'Attachment',title:'ICT attachment: web and mobile support',poster:'Posted by a Strathmore lecturer',place:'Nairobi',dl:12,roles:['student'],blurb:'Three months hosted by a growing fintech team. Bring a portfolio link; a laptop is provided.'},
  {id:'o2',type:'Scholarship',title:'Postgraduate scholarship in agricultural economics',poster:'Shared by Egerton staff',place:'Njoro',dl:25,roles:['student','lecturer'],blurb:'Tuition support plus a research stipend. Read the full call before the deadline and confirm it on the funder\'s own site.'},
  {id:'o3',type:'Hackathon',title:'Inter-university health-tech hackathon',poster:'Posted by Maseno students',place:'Online + Kisumu',dl:9,roles:['student'],blurb:'48 hours, mixed teams from at least three universities. Mentors from nursing and computing.'},
  {id:'o4',type:'Grant',title:'Research collaboration call: climate-smart farming',poster:'Posted by a Moi University lecturer',place:'Eldoret',dl:30,roles:['lecturer'],blurb:'Looking for two co-investigators in soil science or agribusiness. Budget shared across universities.'},
  {id:'o5',type:'Job',title:'Assistant librarian (digital services)',poster:'Posted by a Kisii University guild member',place:'Kisii',dl:15,roles:['staff'],blurb:'Maintain repository and training for first-year students. Open to staff in any university library.'},
  {id:'o6',type:'Partnership',title:'Guest lecturers wanted: entrepreneurship unit',poster:'Posted by Kabarak staff',place:'Online',dl:20,roles:['lecturer'],blurb:'Two 60-minute virtual sessions for 250 students. Co-branded certificates for guest speakers.'},
  {id:'o7',type:'Attachment',title:'Civil engineering site attachment',poster:'Posted by a JKUAT student society',place:'Thika',dl:18,roles:['student'],blurb:'Eight weeks on a road project. Safety gear provided. Priority for Year 3 students.'},
  {id:'o8',type:'Platform',title:'Student-run tutoring platform needs two developers',poster:'Posted by Machakos University students',place:'Remote',dl:35,roles:['student'],blurb:'Open-source project. Good first project for building a team across campuses.'},
  {id:'o9',type:'Job swap',title:'Registry officer seeking swap: Nairobi to Mombasa',poster:'Posted by a Registry guild member',place:'Mombasa',dl:40,roles:['staff'],blurb:'Same grade and similar duties. Contact through the platform so both sides stay protected.'},
  {id:'o10',type:'Scholarship',title:'Undergraduate bursary for first-class students in STEM',poster:'Shared by Technical University staff',place:'Nairobi',dl:14,roles:['student'],blurb:'Covers part of tuition for one year. Always apply on the sponsor\'s official channel.'}
];
const OPP_TYPES = ['Attachment','Scholarship','Hackathon','Grant','Job','Partnership','Platform','Job swap'];

/* ---------- Feed (example posts) ---------- */
const FEED = [
  {id:'f1',role:'student',name:'Wanjiru K.',uni:'KU',space:'Calculus I',min:18,text:'Does anyone have a clear way to remember the chain rule? My lecturer rushed it and the CAT is on Thursday.'},
  {id:'f2',role:'lecturer',name:'Dr. Barasa W.',uni:'Moi',space:'Constitutional Law',min:55,text:'I can offer one virtual guest session on devolution case law next month. Any lecturer who wants it for their class, send me a message.'},
  {id:'f3',role:'staff',name:'Esther N.',uni:'UoN',space:'Librarians',min:96,text:'Tip: your university may already have access to these open-access journals through a consortium. Ask your e-resources desk before buying anything.'},
  {id:'f4',role:'student',name:'Hassan A.',uni:'Pwani',space:'Campus Startups',min:140,text:'Building a small app that matches students who want to share transport home during long weekends. Need one designer and one backend dev. DM me.'},
  {id:'f5',role:'student',name:'Atieno P.',uni:'Tom Mboya',space:'Mind & Wellbeing',min:230,text:'Exam stress is real. I started a 20-minute walk at 6am with two friends from other campuses on a call. It helps. Join us if you want.'},
  {id:'f6',role:'lecturer',name:'Dr. Njeri M.',uni:'JKUAT',space:'Research Circle',min:310,text:'Looking for a co-author in public health informatics. Dataset is ready, ethics approval in hand.'},
  {id:'f7',role:'staff',name:'Peter O.',uni:'Maseno',space:'ICT Officers',min:420,text:'Reminder to all ICT teams: change default admin passwords on lab routers. Found three that had never been changed.'}
];
const PROJECTS = [
  {id:'p1',title:'Offline notes app for low-data students',need:'Needs: 1 designer, 1 Android dev',uni:'Machakos Uni'},
  {id:'p2',title:'Campus lost-and-found, one app for every university',need:'Needs: backend dev, moderator',uni:'KU'},
  {id:'p3',title:'Dairy cooperative record-keeping tool',need:'Needs: agribusiness student, UI helper',uni:'Egerton'}
];
const LECTURES = [
  {id:'x1',type:'Offer',who:'Dr. Barasa W.',uni:'Moi',text:'Devolution case law, 60 minutes, virtual'},
  {id:'x2',type:'Request',who:'Prof. Achola',uni:'Maseno',text:'Needs a guest on supply-chain management for a final-year class'},
  {id:'x3',type:'Offer',who:'Dr. Hawa S.',uni:'TUM',text:'Marine ecology field methods, virtual or recorded'}
];
const THREADS = [
  {who:'Barasa W.',uni:'Kibabii',when:'Today',pre:'Hi! I saw your post in Introduction to Programming. Want to pair on the assignment?'},
  {who:'Dr. Njeri M.',uni:'JKUAT',when:'Yesterday',pre:'Thanks for your interest in the research call. I will send the one-page brief here.'},
  {who:'Moderator team',uni:'Chuo Moja',when:'Mon',pre:'Welcome to Chuo Moja. Please read the community rules before you post.'}
];
const PEOPLE = [
  {n:'Achieng O.',u:'Maseno',c:'BSc Statistics, Year 2',i:'poetry and data'},
  {n:'Kiprono L.',u:'Moi',c:'LLB, Year 3',i:'moot court'},
  {n:'Mwende K.',u:'Machakos Uni',c:'BEd Science, Year 1',i:'football'},
  {n:'Barasa W.',u:'Kibabii',c:'BSc Computer Science, Year 2',i:'hackathons'},
  {n:'Hassan A.',u:'Pwani',c:'BSc Marine Science, Year 4',i:'coastal tourism'},
  {n:'Njeri M.',u:'JKUAT',c:'BSc Civil Engineering, Year 3',i:'structures'},
  {n:'Chebet J.',u:'Egerton',c:'BSc Agribusiness, Year 2',i:'dairy startups'},
  {n:'Atieno P.',u:'Tom Mboya',c:'BCom, Year 1',i:'personal finance'}
];
const ICEBREAKERS = ['What unit is giving you the most trouble this semester?','If you could start any business on your campus tomorrow, what would it be?','Which place near your campus has the best chapati?','What is one thing your university does better than any other?'];

/* ---------- UI words ---------- */
const I18N = {
 en:{home:'Home',spaces:'Spaces',calls:'Calls',opps:'Opportunities',me:'Me',student:'Student',lecturer:'Lecturer',staff:'Staff',
  hi:'Habari',today:'Kenya today',upnext:'Up next',rsvp:'RSVP',going:'Going',join:'Join',joined:'Joined',post:'Post',share:'Share something with every campus…',
  meet:'Meet someone new',save:'Save',saved:'Saved',search:'Search',live:'Live now',apply:'Apply',deadline:'Deadline',lang:'Language',
  rules:'Community rules',messages:'Messages',week:'My week',overlay:'Show national calendar',helpful:'Helpful',all:'Everyone',mine:'My university',mymu:'My units',
  example:'Example',units:'Unit Hubs',interests:'Interests',guilds:'Guilds',counties:'Counties',notes:'Notes',qa:'Q&A',groups:'Study groups',
  banner:'This is a working prototype. The people, posts and listings are examples. Posts you add are real and shared with other viewers of this page.',
  openlines:'Open Lines',guest:'Guest Lecture Exchange',lab:'Idea & Project Lab',yourhubs:'Your Unit Hubs',guild:'Staff Guilds',roleq:'Viewing as',back:'Back',
  profile:'Profile',university:'University',dept:'Department or course',saves:'Saved opportunities',route:'Roadmap',cal:'Calendar'},
 sw:{home:'Nyumbani',spaces:'Jumuiya',calls:'Mazungumzo',opps:'Fursa',me:'Wasifu',student:'Mwanafunzi',lecturer:'Mhadhiri',staff:'Mfanyakazi',
  hi:'Habari',today:'Kenya leo',upnext:'Yanayofuata',rsvp:'Nitahudhuria',going:'Utahudhuria',join:'Jiunge',joined:'Umejiunga',post:'Chapisha',share:'Shiriki kitu na vyuo vyote…',
  meet:'Kutana na mtu mpya',save:'Hifadhi',saved:'Imehifadhiwa',search:'Tafuta',live:'Sasa hivi',apply:'Tuma ombi',deadline:'Mwisho',lang:'Lugha',
  rules:'Kanuni za jamii',messages:'Ujumbe',week:'Wiki yangu',overlay:'Onyesha kalenda ya kitaifa',helpful:'Inasaidia',all:'Wote',mine:'Chuo changu',mymu:'Units zangu',
  example:'Mfano',units:'Vituo vya Masomo',interests:'Mapendeleo',guilds:'Vyama vya Wafanyakazi',counties:'Kaunti',notes:'Maelezo',qa:'Maswali',groups:'Vikundi vya kusoma',
  banner:'Hili ni toleo la majaribio. Watu, machapisho na fursa zilizoonyeshwa ni mifano. Machapisho utakayoongeza ni halisi na yataonekana kwa wengine.',
  openlines:'Open Lines',guest:'Mabadilishano ya Wahadhiri Wageni',lab:'Maabara ya Mawazo na Miradi',yourhubs:'Vituo vyako',guild:'Vyama vya Wafanyakazi',roleq:'Unaangalia kama',back:'Rudi',
  profile:'Wasifu',university:'Chuo kikuu',dept:'Idara au kozi',saves:'Fursa ulizohifadhi',route:'Ramani ya ujenzi',cal:'Kalenda'}
};
