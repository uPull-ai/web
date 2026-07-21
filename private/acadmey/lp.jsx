import React, { useState, useEffect } from 'react';
import { ChevronRight, Award, Users, BookOpen, Zap, CheckCircle, ArrowRight, Menu, X } from 'lucide-react';

export default function UPullLearningPortal() {
  const [currentSection, setCurrentSection] = useState('hero');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showPathwayQuiz, setShowPathwayQuiz] = useState(false);
  const [quizProgress, setQuizProgress] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Learning Pathway Data
  const categories = [
    {
      id: 'agentic',
      name: 'Agentic AI',
      icon: '🤖',
      description: 'Goal-directed autonomous systems and multi-step workflow automation',
      color: 'from-blue-600 to-blue-800',
      audience: 'Architects, Developers, Workflow Leaders',
      icon_color: 'text-blue-600'
    },
    {
      id: 'clinical',
      name: 'Clinical AI',
      icon: '⚕️',
      description: 'Diagnostic support, clinical decision-making, and patient care optimisation',
      color: 'from-green-600 to-green-800',
      audience: 'Clinicians, Clinical Informaticists',
      icon_color: 'text-green-600'
    },
    {
      id: 'robotic',
      name: 'Robotic & Ambient',
      icon: '🔄',
      description: 'Process automation, voice documentation, and workflow optimisation',
      color: 'from-purple-600 to-purple-800',
      audience: 'Operations Managers, Process Engineers',
      icon_color: 'text-purple-600'
    },
    {
      id: 'ambience',
      name: 'Ambient Intelligence',
      icon: '🎙️',
      description: 'Continuous environmental sensing, passive data capture, and seamless integration',
      color: 'from-orange-600 to-orange-800',
      audience: 'Clinical Leaders, Digital Leads',
      icon_color: 'text-orange-600'
    }
  ];

  const courses = {
    foundation: [
      {
        id: 'intro-ai-1',
        title: 'Introduction to AI in Healthcare',
        category: 'foundation',
        level: 'Beginner',
        duration: '6 hours',
        cpdCredits: 6,
        freeNHS: true,
        description: 'Fundamentals of AI, healthcare applications, and governance basics',
        audience: ['All professionals'],
        completionRate: 92,
        rating: 4.8
      }
    ],
    agentic: [
      {
        id: 'agentic-1',
        title: 'Agentic AI Fundamentals',
        category: 'agentic',
        level: 'Intermediate',
        duration: '8 hours',
        cpdCredits: 8,
        freeNHS: true,
        description: 'Autonomous decision-making, multi-step workflows, and adaptive systems',
        audience: ['Developers', 'Architects', 'Technical Leaders'],
        completionRate: 87,
        rating: 4.7,
        practical: true
      },
      {
        id: 'agentic-2',
        title: 'Deploying Agentic Systems at Scale',
        category: 'agentic',
        level: 'Advanced',
        duration: '12 hours',
        cpdCredits: 12,
        freeNHS: false,
        price: '£149',
        description: 'Production deployment, monitoring, and governance of autonomous agents',
        audience: ['Technical Leads', 'Infrastructure Engineers'],
        completionRate: 78,
        rating: 4.6,
        practical: true
      }
    ],
    clinical: [
      {
        id: 'clinical-1',
        title: 'Clinical AI Implementation Planning',
        category: 'clinical',
        level: 'Intermediate',
        duration: '10 hours',
        cpdCredits: 10,
        freeNHS: true,
        description: 'Regulatory compliance, clinical governance, and implementation roadmaps',
        audience: ['Clinicians', 'Clinical Leads', 'Informaticists'],
        completionRate: 89,
        rating: 4.8,
        practical: true
      },
      {
        id: 'clinical-2',
        title: 'Diagnostic AI Systems Deep Dive',
        category: 'clinical',
        level: 'Advanced',
        duration: '14 hours',
        cpdCredits: 14,
        freeNHS: false,
        price: '£179',
        description: 'Medical imaging analysis, diagnostic accuracy, and clinical validation',
        audience: ['Clinical Specialists', 'Radiologists', 'Pathologists'],
        completionRate: 81,
        rating: 4.7,
        practical: true
      }
    ],
    robotic: [
      {
        id: 'robotic-1',
        title: 'Workflow Automation & Process Redesign',
        category: 'robotic',
        level: 'Intermediate',
        duration: '9 hours',
        cpdCredits: 9,
        freeNHS: true,
        description: 'Identifying bottlenecks, process mapping, and RPA fundamentals',
        audience: ['Operations Managers', 'Process Engineers'],
        completionRate: 90,
        rating: 4.7,
        practical: true
      },
      {
        id: 'robotic-2',
        title: 'Ambient Voice Documentation Systems',
        category: 'robotic',
        level: 'Advanced',
        duration: '11 hours',
        cpdCredits: 11,
        freeNHS: false,
        price: '£159',
        description: 'Voice capture, clinical documentation automation, and data integration',
        audience: ['Clinical Leaders', 'IT Leads'],
        completionRate: 85,
        rating: 4.8,
        practical: true
      }
    ],
    ambience: [
      {
        id: 'ambience-1',
        title: 'Ambient Intelligence Governance',
        category: 'ambience',
        level: 'Intermediate',
        duration: '9 hours',
        cpdCredits: 9,
        freeNHS: true,
        description: 'Privacy frameworks, data governance, and regulatory compliance',
        audience: ['Privacy Officers', 'Digital Leads', 'Clinical Governance'],
        completionRate: 88,
        rating: 4.7,
        practical: true
      },
      {
        id: 'ambience-2',
        title: 'Building Passive Data Ecosystems',
        category: 'ambience',
        level: 'Advanced',
        duration: '13 hours',
        cpdCredits: 13,
        freeNHS: false,
        price: '£169',
        description: 'Continuous sensing, data architecture, and healthcare integration',
        audience: ['Architects', 'Data Engineers'],
        completionRate: 82,
        rating: 4.6,
        practical: true
      }
    ]
  };

  const pathwayQuizQuestions = [
    {
      q: "What's your primary role?",
      options: [
        { text: 'Clinician or Clinical Leader', scores: { clinical: 3, agentic: 1, robotic: 0, ambience: 1 } },
        { text: 'Developer or Architect', scores: { agentic: 3, clinical: 0, robotic: 1, ambience: 1 } },
        { text: 'Operations or Process Manager', scores: { robotic: 3, agentic: 1, clinical: 0, ambience: 1 } },
        { text: 'IT / Digital Leader', scores: { ambience: 2, agentic: 2, clinical: 1, robotic: 1 } }
      ]
    },
    {
      q: "What's your main challenge?",
      options: [
        { text: 'Automating repetitive administrative tasks', scores: { robotic: 3, agentic: 2, clinical: 0, ambience: 1 } },
        { text: 'Improving clinical decisions & diagnostics', scores: { clinical: 3, agentic: 1, robotic: 0, ambience: 1 } },
        { text: 'Scaling autonomous systems & workflows', scores: { agentic: 3, robotic: 1, clinical: 1, ambience: 0 } },
        { text: 'Capturing & integrating continuous data', scores: { ambience: 3, agentic: 1, clinical: 1, robotic: 0 } }
      ]
    },
    {
      q: "What outcome matters most?",
      options: [
        { text: 'Staff time savings & efficiency', scores: { robotic: 3, agentic: 1, clinical: 0, ambience: 1 } },
        { text: 'Better patient care & safety', scores: { clinical: 3, ambience: 1, agentic: 1, robotic: 0 } },
        { text: 'Autonomous decision-making at scale', scores: { agentic: 3, robotic: 1, clinical: 1, ambience: 0 } },
        { text: 'Seamless data flow & integration', scores: { ambience: 3, agentic: 1, robotic: 1, clinical: 0 } }
      ]
    }
  ];

  const handleQuizAnswer = (scores) => {
    const newProgress = quizProgress + 1;
    setQuizProgress(newProgress);

    if (newProgress < pathwayQuizQuestions.length) {
      // Continue quiz
    } else {
      // Calculate recommendation
      const totalScores = Object.keys(categories).reduce((acc, cat) => {
        acc[cat] = (acc[cat] || 0) + scores[cat];
        return acc;
      }, {});
      
      const recommended = Object.keys(totalScores).reduce((a, b) => 
        totalScores[a] > totalScores[b] ? a : b
      );
      
      setUserProfile({
        recommendedCategory: recommended,
        scores: totalScores
      });
      setShowPathwayQuiz(false);
    }
  };

  const CourseCard = ({ course }) => (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow p-6">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide">{course.category}</div>
          <h3 className="text-lg font-bold text-gray-900 mt-1">{course.title}</h3>
        </div>
        {course.freeNHS && <div className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded">FREE NHS</div>}
      </div>
      <p className="text-gray-600 text-sm mb-4">{course.description}</p>
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div><span className="font-semibold text-gray-900">{course.cpdCredits}</span> <span className="text-gray-600">CPD Credits</span></div>
        <div><span className="font-semibold text-gray-900">{course.duration}</span> <span className="text-gray-600">Duration</span></div>
        <div><span className="font-semibold text-gray-900">{course.level}</span> <span className="text-gray-600">Level</span></div>
        <div><span className="font-semibold text-gray-900">★ {course.rating}</span> <span className="text-gray-600">{course.completionRate}% complete</span></div>
      </div>
      <div className="mb-4 border-t pt-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">For: {course.audience.join(', ')}</p>
        {course.practical && <div className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded">Includes Practical Project</div>}
      </div>
      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
        Enroll Now
      </button>
    </div>
  );

  const renderContent = () => {
    switch(currentSection) {
      case 'hero':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            {/* Navigation */}
            <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
              <div className="text-2xl font-bold">
                <span className="text-blue-400">uPull</span>.ai Learning
              </div>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className={`hidden md:flex gap-8 items-center ${mobileMenuOpen ? 'flex flex-col absolute top-16 left-0 right-0 bg-slate-900 p-4' : ''}`}>
                <button onClick={() => { setCurrentSection('pathways'); setMobileMenuOpen(false); }} className="hover:text-blue-400 transition">Learning Paths</button>
                <button onClick={() => { setCurrentSection('courses'); setMobileMenuOpen(false); }} className="hover:text-blue-400 transition">Courses</button>
                <button onClick={() => { setCurrentSection('community'); setMobileMenuOpen(false); }} className="hover:text-blue-400 transition">Community</button>
                <button onClick={() => { setCurrentSection('recognition'); setMobileMenuOpen(false); }} className="hover:text-blue-400 transition">Badges & CPD</button>
              </div>
            </nav>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-6 py-20">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                    Learn AI. <span className="text-blue-400">Implement</span>. Transform.
                  </h1>
                  <p className="text-xl text-gray-300 mb-8">
                    Four guided pathways for NHS and public sector professionals to master AI implementation. Free for public sector. Recognised CPD credits. Practical, workflow-first learning.
                  </p>
                  <button 
                    onClick={() => setShowPathwayQuiz(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg inline-flex items-center gap-2 text-lg transition-all transform hover:scale-105"
                  >
                    Find Your Pathway <ArrowRight size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="bg-slate-700 bg-opacity-50 p-6 rounded-lg border border-slate-600 hover:border-blue-400 transition cursor-pointer" onClick={() => { setSelectedCategory(cat.id); setCurrentSection('pathways'); }}>
                      <div className="text-4xl mb-3">{cat.icon}</div>
                      <h3 className="font-bold text-lg">{cat.name}</h3>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">4</div>
                  <p className="text-gray-300">Learning Pathways</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">Free</div>
                  <p className="text-gray-300">For NHS/Public</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">50+</div>
                  <p className="text-gray-300">CPD Courses</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">2K+</div>
                  <p className="text-gray-300">Active Learners</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pathways':
        return (
          <div className="min-h-screen bg-gray-50 py-20">
            <div className="max-w-7xl mx-auto px-6">
              <h1 className="text-4xl font-bold mb-4">Learning Pathways</h1>
              <p className="text-xl text-gray-600 mb-12">Choose your path or let our assessment guide you</p>
              
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {categories.map(cat => (
                  <div 
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-8 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105 ${
                      selectedCategory === cat.id 
                        ? 'bg-gradient-to-br ' + cat.color + ' text-white border-transparent' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-5xl mb-4">{cat.icon}</div>
                    <h3 className={`text-2xl font-bold mb-3 ${selectedCategory !== cat.id ? 'text-gray-900' : ''}`}>{cat.name}</h3>
                    <p className={`mb-4 text-sm ${selectedCategory !== cat.id ? 'text-gray-600' : 'text-gray-100'}`}>{cat.description}</p>
                    <p className={`text-sm font-semibold ${selectedCategory !== cat.id ? 'text-gray-600' : 'text-gray-100'}`}>👥 {cat.audience}</p>
                  </div>
                ))}
              </div>

              {selectedCategory && (
                <div className="bg-white p-8 rounded-lg border border-gray-200">
                  <h2 className="text-2xl font-bold mb-6">
                    {categories.find(c => c.id === selectedCategory)?.name} Learning Path
                  </h2>
                  <div className="space-y-4">
                    {[
                      { level: 'Foundation', duration: '6 hours', credits: '6', status: 'Optional' },
                      { level: 'Introduction to ' + categories.find(c => c.id === selectedCategory)?.name, duration: '8 hours', credits: '8', status: 'Start Here' },
                      { level: 'Intermediate Module', duration: '10-12 hours', credits: '10-12', status: 'Core' },
                      { level: 'Advanced Specialisation', duration: '14-16 hours', credits: '14-16', status: 'Optional' },
                      { level: 'Capstone Project', duration: 'Self-paced', credits: '20', status: 'Optional' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">{idx + 1}</div>
                        <div className="flex-grow">
                          <h4 className="font-bold text-gray-900">{item.level}</h4>
                          <p className="text-sm text-gray-600">{item.duration} • {item.credits} CPD Credits</p>
                        </div>
                        <div className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded">{item.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'courses':
        return (
          <div className="min-h-screen bg-gray-50 py-20">
            <div className="max-w-7xl mx-auto px-6">
              <h1 className="text-4xl font-bold mb-4">All Courses</h1>
              <p className="text-xl text-gray-600 mb-12">Filter by category and find courses that match your learning goals</p>
              
              <div className="mb-8 flex gap-2 flex-wrap">
                {['all', 'foundation', 'agentic', 'clinical', 'robotic', 'ambience'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setSelectedCategory(filter === 'all' ? null : filter)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      (filter === 'all' && !selectedCategory) || selectedCategory === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-600'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(courses).flat().filter(c => !selectedCategory || c.category === selectedCategory || c.category === 'foundation').map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          </div>
        );

      case 'community':
        return (
          <div className="min-h-screen bg-gray-50 py-20">
            <div className="max-w-7xl mx-auto px-6">
              <h1 className="text-4xl font-bold mb-4">Community & Collaboration</h1>
              <p className="text-xl text-gray-600 mb-12">Connect with learners, leaders, and suppliers across the NHS and public sector</p>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-lg border border-gray-200">
                  <Users size={48} className="text-blue-600 mb-4" />
                  <h3 className="text-2xl font-bold mb-3">Discussion Forums</h3>
                  <p className="text-gray-600 mb-4">Join conversations with peers learning the same pathway. Share challenges, solutions, and best practices.</p>
                  <button className="text-blue-600 font-bold hover:text-blue-700">Join Forums →</button>
                </div>

                <div className="bg-white p-8 rounded-lg border border-gray-200">
                  <Award size={48} className="text-green-600 mb-4" />
                  <h3 className="text-2xl font-bold mb-3">Expert Q&A</h3>
                  <p className="text-gray-600 mb-4">Get answers from certified practitioners and Recognised experts in each AI category.</p>
                  <button className="text-blue-600 font-bold hover:text-blue-700">Ask a Question →</button>
                </div>

                <div className="bg-white p-8 rounded-lg border border-gray-200">
                  <BookOpen size={48} className="text-purple-600 mb-4" />
                  <h3 className="text-2xl font-bold mb-3">Case Study Library</h3>
                  <p className="text-gray-600 mb-4">Learn from real NHS implementations. See before/after metrics, ROI, and lessons learned.</p>
                  <button className="text-blue-600 font-bold hover:text-blue-700">Explore Cases →</button>
                </div>

                <div className="bg-white p-8 rounded-lg border border-gray-200">
                  <Zap size={48} className="text-orange-600 mb-4" />
                  <h3 className="text-2xl font-bold mb-3">Peer Mentoring</h3>
                  <p className="text-gray-600 mb-4">Get matched with mentors who have completed your pathway. One-on-one guidance and support.</p>
                  <button className="text-blue-600 font-bold hover:text-blue-700">Find a Mentor →</button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'recognition':
        return (
          <div className="min-h-screen bg-gray-50 py-20">
            <div className="max-w-7xl mx-auto px-6">
              <h1 className="text-4xl font-bold mb-4">Badges, CPD & Recognition</h1>
              <p className="text-xl text-gray-600 mb-12">Earn Recognised credentials that boost your career and CV</p>
              
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-white p-8 rounded-lg border border-gray-200">
                  <h3 className="text-2xl font-bold mb-4">Digital Badges</h3>
                  <p className="text-gray-600 mb-6">Each completed course earns you a verified digital badge with embedded credentials. Share on LinkedIn, email, or your CV.</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-5xl mb-2">🏅</div>
                      <p className="text-sm font-semibold text-gray-700">Awareness</p>
                      <p className="text-xs text-gray-600">Foundations</p>
                    </div>
                    <div className="text-center">
                      <div className="text-5xl mb-2">⭐</div>
                      <p className="text-sm font-semibold text-gray-700">Practitioner</p>
                      <p className="text-xs text-gray-600">Intermediate</p>
                    </div>
                    <div className="text-center">
                      <div className="text-5xl mb-2">👑</div>
                      <p className="text-sm font-semibold text-gray-700">Specialist</p>
                      <p className="text-xs text-gray-600">Advanced</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-lg border border-gray-200">
                  <h3 className="text-2xl font-bold mb-4">CPD Credits</h3>
                  <p className="text-gray-600 mb-6">All courses are accredited and Recognised by professional bodies and NHS standards.</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-600" size={24} />
                      <div>
                        <p className="font-bold text-gray-900">CPDSO Accredited</p>
                        <p className="text-sm text-gray-600">Independent third-party verification</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-600" size={24} />
                      <div>
                        <p className="font-bold text-gray-900">Open CPD Verified</p>
                        <p className="text-sm text-gray-600">Blockchain-secured credentials</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-600" size={24} />
                      <div>
                        <p className="font-bold text-gray-900">Vendor Partnerships</p>
                        <p className="text-sm text-gray-600">Microsoft, AWS, Google Cloud certified</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-12 rounded-lg">
                <h3 className="text-3xl font-bold mb-6">Your Learning Record</h3>
                <p className="mb-8 text-blue-100">Build your professional portfolio as you learn</p>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="bg-blue-700 p-6 rounded-lg">
                    <p className="text-4xl font-bold mb-2">0</p>
                    <p className="text-blue-100">Courses Completed</p>
                  </div>
                  <div className="bg-blue-700 p-6 rounded-lg">
                    <p className="text-4xl font-bold mb-2">0</p>
                    <p className="text-blue-100">CPD Credits Earned</p>
                  </div>
                  <div className="bg-blue-700 p-6 rounded-lg">
                    <p className="text-4xl font-bold mb-2">0</p>
                    <p className="text-blue-100">Badges Unlocked</p>
                  </div>
                </div>
                <button className="mt-8 bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition">
                  Start Learning Today
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Pathway Quiz Modal */}
      {showPathwayQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-8">
            <h2 className="text-3xl font-bold mb-8">Find Your Learning Pathway</h2>
            <div className="mb-8">
              <div className="flex gap-2 mb-6">
                {[...Array(pathwayQuizQuestions.length)].map((_, i) => (
                  <div key={i} className={`h-2 flex-grow rounded ${i < quizProgress ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                ))}
              </div>
              {quizProgress < pathwayQuizQuestions.length ? (
                <div>
                  <h3 className="text-2xl font-bold mb-6">{pathwayQuizQuestions[quizProgress].q}</h3>
                  <div className="space-y-3">
                    {pathwayQuizQuestions[quizProgress].options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuizAnswer(option.scores)}
                        className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-left font-semibold text-gray-900"
                      >
                        {option.text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">Your Recommended Pathway</h3>
                  {userProfile && (
                    <div>
                      <p className="text-6xl mb-4">{categories.find(c => c.id === userProfile.recommendedCategory)?.icon}</p>
                      <h4 className="text-3xl font-bold text-blue-600 mb-4">{categories.find(c => c.id === userProfile.recommendedCategory)?.name}</h4>
                      <p className="text-gray-600 mb-6">{categories.find(c => c.id === userProfile.recommendedCategory)?.description}</p>
                      <button
                        onClick={() => {
                          setSelectedCategory(userProfile.recommendedCategory);
                          setCurrentSection('pathways');
                          setShowPathwayQuiz(false);
                          setQuizProgress(0);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition"
                      >
                        Start Learning →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setShowPathwayQuiz(false);
                setQuizProgress(0);
              }}
              className="text-gray-600 hover:text-gray-900 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {renderContent()}

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><button onClick={() => { setCurrentSection('pathways'); setMobileMenuOpen(false); }} className="hover:text-white">Pathways</button></li>
              <li><button onClick={() => { setCurrentSection('courses'); setMobileMenuOpen(false); }} className="hover:text-white">Courses</button></li>
              <li><button onClick={() => { setCurrentSection('community'); setMobileMenuOpen(false); }} className="hover:text-white">Community</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Recognition</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><button onClick={() => { setCurrentSection('recognition'); setMobileMenuOpen(false); }} className="hover:text-white">Badges & CPD</button></li>
              <li className="hover:text-white cursor-pointer">Vendor Partnerships</li>
              <li className="hover:text-white cursor-pointer">Verify Credentials</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="hover:text-white cursor-pointer">Case Studies</li>
              <li className="hover:text-white cursor-pointer">Blog</li>
              <li className="hover:text-white cursor-pointer">Documentation</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">About</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="hover:text-white cursor-pointer">About uPull.ai</li>
              <li className="hover:text-white cursor-pointer">Privacy Policy</li>
              <li className="hover:text-white cursor-pointer">Contact</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-700 pt-8 text-center text-gray-400 text-sm">
          <p>© 2026 uPull.ai Learning Platform. Empowering NHS and public sector AI adoption through workflow-first learning.</p>
        </div>
      </footer>
    </div>
  );
}
