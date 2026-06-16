import { useState, useEffect, useMemo, useRef } from "react";
import styles from "./ZebraPuzzle.module.css";

const items = {
  color: ['Red', 'Green', 'White', 'Yellow', 'Blue'],
  nationality: ['Brit', 'Swede', 'Dane', 'Norwegian', 'German'],
  drink: ['Tea', 'Coffee', 'Milk', 'Beer', 'Water'],
  cigarette: ['Pall Mall', 'Dunhill', 'Blend', 'Blue Master', 'Prince'],
  pet: ['Dog', 'Bird', 'Cat', 'Horse', 'Fish']
};

const categoryIcons = {
  color: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
      <circle cx="7.5" cy="10.5" r="1.5"/>
      <circle cx="11.5" cy="7.5" r="1.5"/>
      <circle cx="16.5" cy="9.5" r="1.5"/>
      <path d="M6 14C6 12 8 11 8 11S9 12 10 13C11 14 12 13.5 13 12.5C14 11.5 14 11 14 11S15.5 13 14 15C12.5 17 8.5 17.5 7.5 17.5C6.5 17.5 6 16 6 14Z"/>
    </svg>
  ),
  nationality: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  drink: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
      <line x1="6" y1="2" x2="6" y2="4"/>
      <line x1="10" y1="2" x2="10" y2="4"/>
      <line x1="14" y1="2" x2="14" y2="4"/>
    </svg>
  ),
  cigarette: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8c0-2.5-2-4-2-4s-2 1.5-2 4 2 4 2 4"/>
      <path d="M12 12c0-2.5-2-4-2-4s-2 1.5-2 4 2 4 2 4"/>
      <path d="M2 20h20"/>
      <path d="M5 17h10"/>
    </svg>
  ),
  pet: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="1.5"/>
      <circle cx="18" cy="7.5" r="1.5"/>
      <circle cx="6" cy="7.5" r="1.5"/>
      <circle cx="13.5" cy="4" r="1.5"/>
      <path d="M12 10c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z"/>
    </svg>
  )
};

export default function ZebraPuzzle({ onBack }) {
  // 1. Initial states from localStorage or defaults
  const [boardState, setBoardState] = useState(() => {
    const saved = localStorage.getItem("zebra_puzzle_state_react");
    return saved ? JSON.parse(saved) : [
      { color: null, nationality: null, drink: null, cigarette: null, pet: null },
      { color: null, nationality: null, drink: null, cigarette: null, pet: null },
      { color: null, nationality: null, drink: null, cigarette: null, pet: null },
      { color: null, nationality: null, drink: null, cigarette: null, pet: null },
      { color: null, nationality: null, drink: null, cigarette: null, pet: null }
    ];
  });

  const [manualStrikes, setManualStrikes] = useState(() => {
    const saved = localStorage.getItem("zebra_puzzle_strikes_react");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [clueAssistant, setClueAssistant] = useState(true);
  const [selectedPill, setSelectedPill] = useState(null); // { category, value, fromHouseIdx }
  
  // Drag & drop visual track states
  const [draggedItem, setDraggedItem] = useState(null); // { category, value, fromHouseIdx }
  const [draggedOverSlot, setDraggedOverSlot] = useState(null); // { houseIdx, category }

  // Modals state
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  // Hover highlighting categories
  const [hoveredClueSlots, setHoveredClueSlots] = useState([]);

  const canvasRef = useRef(null);

  // 2. Autosave triggers
  useEffect(() => {
    localStorage.setItem("zebra_puzzle_state_react", JSON.stringify(boardState));
  }, [boardState]);

  useEffect(() => {
    localStorage.setItem("zebra_puzzle_strikes_react", JSON.stringify([...manualStrikes]));
  }, [manualStrikes]);

  // 3. Logic Engines
  const findHouseIdx = (category, val) => {
    for (let i = 0; i < 5; i++) {
      if (boardState[i][category] === val) return i;
    }
    return -1;
  };

  const checkRelation = (catA, valA, catB, valB, relationType) => {
    const idxA = findHouseIdx(catA, valA);
    const idxB = findHouseIdx(catB, valB);

    if (idxA === -1 || idxB === -1) {
      if (relationType === 'left_neighbor') {
        if (idxA === 4) return 'violated';
        if (idxB === 0) return 'violated';
      }
      return 'undetermined';
    }

    if (relationType === 'same_house') {
      return idxA === idxB ? 'satisfied' : 'violated';
    }

    if (relationType === 'left_neighbor') {
      return idxA === idxB - 1 ? 'satisfied' : 'violated';
    }

    if (relationType === 'next_door') {
      return Math.abs(idxA - idxB) === 1 ? 'satisfied' : 'violated';
    }

    return 'undetermined';
  };

  const checkFixedHouse = (cat, val, targetIdx) => {
    const idx = findHouseIdx(cat, val);
    if (idx === -1) return 'undetermined';
    return idx === targetIdx ? 'satisfied' : 'violated';
  };

  // 4. Clues mapping with live computed statuses
  const cluesWithStatus = useMemo(() => {
    return [
      {
        id: 1,
        text: "The Brit lives in the red house.",
        slots: ['nationality', 'color'],
        status: checkRelation('nationality', 'Brit', 'color', 'Red', 'same_house')
      },
      {
        id: 2,
        text: "The Swede keeps a dog.",
        slots: ['nationality', 'pet'],
        status: checkRelation('nationality', 'Swede', 'pet', 'Dog', 'same_house')
      },
      {
        id: 3,
        text: "The Dane drinks tea.",
        slots: ['nationality', 'drink'],
        status: checkRelation('nationality', 'Dane', 'drink', 'Tea', 'same_house')
      },
      {
        id: 4,
        text: "The green house is on the left side of the white house.",
        slots: ['color'],
        status: checkRelation('color', 'Green', 'color', 'White', 'left_neighbor')
      },
      {
        id: 5,
        text: "The owner of the green house drinks coffee.",
        slots: ['color', 'drink'],
        status: checkRelation('color', 'Green', 'drink', 'Coffee', 'same_house')
      },
      {
        id: 6,
        text: "The person who smokes Pall Mall rears a bird.",
        slots: ['cigarette', 'pet'],
        status: checkRelation('cigarette', 'Pall Mall', 'pet', 'Bird', 'same_house')
      },
      {
        id: 7,
        text: "The owner of the yellow house smokes Dunhill.",
        slots: ['color', 'cigarette'],
        status: checkRelation('color', 'Yellow', 'cigarette', 'Dunhill', 'same_house')
      },
      {
        id: 8,
        text: "The person living in the center house drinks milk.",
        slots: ['drink'],
        status: checkFixedHouse('drink', 'Milk', 2)
      },
      {
        id: 9,
        text: "The Norwegian lives in the first house.",
        slots: ['nationality'],
        status: checkFixedHouse('nationality', 'Norwegian', 0)
      },
      {
        id: 10,
        text: "The person who smokes Blend lives next to the person who keeps a cat.",
        slots: ['cigarette', 'pet'],
        status: checkRelation('cigarette', 'Blend', 'pet', 'Cat', 'next_door')
      },
      {
        id: 11,
        text: "The person who keeps a horse lives next to the person who smokes Dunhill.",
        slots: ['pet', 'cigarette'],
        status: checkRelation('pet', 'Horse', 'cigarette', 'Dunhill', 'next_door')
      },
      {
        id: 12,
        text: "The person who smokes Blue Master drinks beer.",
        slots: ['cigarette', 'drink'],
        status: checkRelation('cigarette', 'Blue Master', 'drink', 'Beer', 'same_house')
      },
      {
        id: 13,
        text: "The German smokes Prince.",
        slots: ['nationality', 'cigarette'],
        status: checkRelation('nationality', 'German', 'cigarette', 'Prince', 'same_house')
      },
      {
        id: 14,
        text: "The Norwegian lives next to the blue house.",
        slots: ['nationality', 'color'],
        status: checkRelation('nationality', 'Norwegian', 'color', 'Blue', 'next_door')
      },
      {
        id: 15,
        text: "The person who smokes Blend has a neighbor who drinks water.",
        slots: ['cigarette', 'drink'],
        status: checkRelation('cigarette', 'Blend', 'drink', 'Water', 'next_door')
      }
    ];
  }, [boardState]);

  // 5. Check Victory state
  useEffect(() => {
    const allFilled = boardState.every(house => 
      Object.values(house).every(val => val !== null)
    );
    if (allFilled) {
      const allSatisfied = cluesWithStatus.every(clue => clue.status === "satisfied");
      if (allSatisfied) {
        setShowVictoryModal(true);
      }
    }
  }, [boardState, cluesWithStatus]);

  // 6. Confetti Particle Canvas Animation
  useEffect(() => {
    if (!showVictoryModal) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height - canvas.height;
        this.size = Math.random() * 8 + 4;
        this.color = `hsl(${Math.random() * 360}, 85%, 60%)`;
        this.speed = Math.random() * 3 + 2;
        this.angle = Math.random() * 360;
        this.spin = Math.random() * 0.2 - 0.1;
      }
      update() {
        this.y += this.speed;
        this.angle += this.spin;
        if (this.y > canvas.height) {
          this.y = -10;
          this.x = Math.random() * canvas.width;
        }
      }
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle * Math.PI / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
      }
    }

    const particles = Array.from({ length: 150 }, () => new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [showVictoryModal]);

  // 7. Operations
  const placePill = (value, toHouseIdx, category) => {
    setBoardState(prev => {
      const next = prev.map(h => ({ ...h }));
      
      // Clear from previous house if placed elsewhere
      for (let i = 0; i < 5; i++) {
        if (next[i][category] === value) {
          next[i][category] = null;
        }
      }
      
      // Place in new house
      next[toHouseIdx][category] = value;
      return next;
    });
    setSelectedPill(null);
  };

  const clearSlot = (houseIdx, category) => {
    setBoardState(prev => {
      const next = prev.map((h, i) => {
        if (i === houseIdx) {
          return { ...h, [category]: null };
        }
        return h;
      });
      return next;
    });
    setSelectedPill(null);
  };

  const resetBoard = () => {
    if (window.confirm("Are you sure you want to reset the board? All progress will be lost.")) {
      setBoardState([
        { color: null, nationality: null, drink: null, cigarette: null, pet: null },
        { color: null, nationality: null, drink: null, cigarette: null, pet: null },
        { color: null, nationality: null, drink: null, cigarette: null, pet: null },
        { color: null, nationality: null, drink: null, cigarette: null, pet: null },
        { color: null, nationality: null, drink: null, cigarette: null, pet: null }
      ]);
      setManualStrikes(new Set());
      setSelectedPill(null);
      setDraggedItem(null);
      setDraggedOverSlot(null);
      setShowVictoryModal(false);
    }
  };

  // Clue manual strikes toggler
  const toggleManualStrike = (clueId) => {
    setManualStrikes(prev => {
      const next = new Set(prev);
      if (next.has(clueId)) {
        next.delete(clueId);
      } else {
        next.add(clueId);
      }
      return next;
    });
  };

  // 8. Interaction Handlers
  const handlePillClick = (category, value, fromHouseIdx = null) => {
    if (selectedPill && selectedPill.category === category && selectedPill.value === value && selectedPill.fromHouseIdx === fromHouseIdx) {
      setSelectedPill(null);
    } else {
      setSelectedPill({ category, value, fromHouseIdx });
    }
  };

  const handleSlotClick = (houseIdx, category) => {
    if (selectedPill) {
      if (selectedPill.category === category) {
        placePill(selectedPill.value, houseIdx, category);
      }
    }
  };

  // Drag-and-drop Handlers
  const handleDragStart = (category, value, fromHouseIdx = null) => {
    setDraggedItem({ category, value, fromHouseIdx });
    setSelectedPill(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOverSlot(null);
  };

  const handleDragOver = (e, houseIdx, category) => {
    if (draggedItem && draggedItem.category === category) {
      e.preventDefault();
      setDraggedOverSlot({ houseIdx, category });
    }
  };

  const handleDragLeave = () => {
    setDraggedOverSlot(null);
  };

  const handleDrop = (toHouseIdx, category) => {
    if (draggedItem && draggedItem.category === category) {
      placePill(draggedItem.value, toHouseIdx, category);
    }
    setDraggedItem(null);
    setDraggedOverSlot(null);
  };

  const handleBankDragOver = (e) => {
    if (draggedItem && draggedItem.fromHouseIdx !== null) {
      e.preventDefault();
    }
  };

  const handleBankDrop = () => {
    if (draggedItem && draggedItem.fromHouseIdx !== null) {
      clearSlot(draggedItem.fromHouseIdx, draggedItem.category);
    }
    setDraggedItem(null);
    setDraggedOverSlot(null);
  };

  // Dismiss selection on blank clicks
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest(`.${styles.pill}`) && !e.target.closest(`.${styles.dropSlot}`)) {
        setSelectedPill(null);
      }
    };
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, []);

  // Compute fish owner
  const fishHouseIdx = findHouseIdx("pet", "Fish");
  const fishOwner = fishHouseIdx !== -1 ? boardState[fishHouseIdx].nationality : "Unknown";

  return (
    <div className={styles.appContainer}>
      <header className={styles.appHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Menu
        </button>

        <div className={styles.headerLogo}>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.iconZebra}>
            <path d="M17 3v6"/>
            <path d="M12 3v13"/>
            <path d="M7 3v18"/>
            <path d="M21 3v3"/>
            <rect x="3" y="3" width="18" height="18" rx="2"/>
          </svg>
          <h1>Einstein's Zebra Puzzle</h1>
        </div>
        <p className={styles.subtitle}>Drag &amp; drop attributes onto the houses to solve the famous riddle. No answers are spoiled—the app dynamically validates your logical configuration.</p>
      </header>

      <div className={styles.mainLayout}>
        {/* Clues Sidebar */}
        <aside className={styles.cluesPanel}>
          <div className={styles.panelHeader}>
            <h2>The Clues</h2>
            <div className={styles.assistantToggle}>
              <span className={styles.toggleLabel}>Clue Assistant</span>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={clueAssistant}
                  onChange={(e) => setClueAssistant(e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>
          <div className={styles.panelDescription}>
            Satisfied clues turn <span className={styles.badgeSuccess}>green</span>, violated clues turn <span className={styles.badgeDanger}>red</span>. Hover a clue to highlight relevant categories.
          </div>
          <ul className={styles.cluesList}>
            {cluesWithStatus.map(clue => {
              const showSatisfied = clueAssistant && clue.status === 'satisfied';
              const showViolated = clueAssistant && clue.status === 'violated';
              const isStruck = manualStrikes.has(clue.id);

              return (
                <li 
                  key={clue.id} 
                  className={`${styles.clueItem} ${showSatisfied ? styles.satisfied : ''} ${showViolated ? styles.violated : ''} ${isStruck ? styles.manualStrike : ''}`}
                  onClick={() => toggleManualStrike(clue.id)}
                  onMouseEnter={() => setHoveredClueSlots(clue.slots)}
                  onMouseLeave={() => setHoveredClueSlots([])}
                >
                  <div className={styles.clueStatus}>
                    <span className={styles.clueDot}></span>
                  </div>
                  <span className={styles.clueText}>{clue.text}</span>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Board & Bank Area */}
        <main className={styles.boardArea}>
          {/* Houses grid */}
          <div className={styles.housesGrid}>
            {boardState.map((house, houseIdx) => (
              <div 
                key={houseIdx} 
                className={styles.houseColumn} 
                data-house-color={house.color || ""}
              >
                <div className={styles.houseHeader}>
                  <span className={styles.houseNumber}>House {houseIdx + 1}</span>
                  <span className={styles.houseLabel}>Properties</span>
                </div>
                <div className={styles.houseSlots}>
                  {Object.keys(items).map(category => {
                    const value = house[category];
                    const isDraggedOver = draggedOverSlot && draggedOverSlot.houseIdx === houseIdx && draggedOverSlot.category === category;
                    const isHighlighted = hoveredClueSlots.includes(category);
                    
                    const isSelected = selectedPill && 
                                      selectedPill.category === category && 
                                      selectedPill.fromHouseIdx === houseIdx;

                    return (
                      <div key={category} className={styles.slotContainer}>
                        <span className={styles.slotLabel}>
                          {categoryIcons[category]} {category}
                        </span>
                        <div 
                          className={`${styles.dropSlot} ${isDraggedOver ? styles.dragOver : ''} ${isHighlighted ? styles.highlightHint : ''}`}
                          onClick={() => handleSlotClick(houseIdx, category)}
                          onDragOver={(e) => handleDragOver(e, houseIdx, category)}
                          onDragLeave={handleDragLeave}
                          onDrop={() => handleDrop(houseIdx, category)}
                        >
                          {value ? (
                            <div 
                              className={`${styles.pill} ${isSelected ? styles.selectedForPlacement : ''}`}
                              data-category={category}
                              draggable
                              onDragStart={() => handleDragStart(category, value, houseIdx)}
                              onDragEnd={handleDragEnd}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePillClick(category, value, houseIdx);
                              }}
                            >
                              {category === "color" && (
                                <span className={`${styles.colorDot} ${styles[value.toLowerCase()]}`}></span>
                              )}
                              <span className={styles.pillText}>{value}</span>
                              <button 
                                className={styles.removeBtn} 
                                title="Remove"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearSlot(houseIdx, category);
                                }}
                              >
                                &times;
                              </button>
                            </div>
                          ) : (
                            <span className={styles.slotPlaceholder}>Drop {category}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className={styles.controlsRow}>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={resetBoard}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M16 3h5v5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M8 21H3v-5"/>
              </svg>
              Reset Board
            </button>
            <button className={`${styles.btn} ${styles.btnInfo}`} onClick={() => setShowHelpModal(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              How to Play
            </button>
          </div>

          {/* Bank section */}
          <section 
            className={styles.elementBankSection}
            onDragOver={handleBankDragOver}
            onDrop={handleBankDrop}
          >
            <h2>Variable Bank</h2>
            <p className={styles.bankInstruction}>Drag items from here to the grid, or click an item then click a grid cell to place it.</p>
            <div className={styles.bankCategories}>
              {Object.keys(items).map(category => (
                <div key={category} className={styles.bankRow}>
                  <span className={styles.bankCategoryTitle}>{category}s</span>
                  <div className={styles.bankPills}>
                    {items[category].map(val => {
                      const inUse = boardState.some(h => h[category] === val);
                      const isSelected = selectedPill && 
                                        selectedPill.category === category && 
                                        selectedPill.value === val && 
                                        selectedPill.fromHouseIdx === null;

                      return (
                        <div 
                          key={val}
                          className={`${styles.pill} ${inUse ? styles.inUse : ''} ${isSelected ? styles.selectedForPlacement : ''}`}
                          data-category={category}
                          draggable={!inUse}
                          onDragStart={() => handleDragStart(category, val, null)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => {
                            if (!inUse) {
                              e.stopPropagation();
                              handlePillClick(category, val, null);
                            }
                          }}
                        >
                          {category === "color" && (
                            <span className={`${styles.colorDot} ${styles[val.toLowerCase()]}`}></span>
                          )}
                          <span className={styles.pillText}>{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className={`${styles.modal} ${styles.show}`} onClick={() => setShowHelpModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <span className={styles.closeBtn} onClick={() => setShowHelpModal(false)}>&times;</span>
            <h2>How to Play &amp; Solve</h2>
            <div className={styles.helpBody}>
              <p>Your goal is to determine the correct arrangement of attributes for all 5 houses to answer: <strong>"Who owns the fish?"</strong></p>
              
              <h3>Interactions</h3>
              <ul>
                <li><strong>Drag &amp; Drop:</strong> Drag any attribute pill from the Variable Bank and drop it into its corresponding category slot in a house. You can also drag pills between houses or drag them back to the bank to clear them.</li>
                <li><strong>Click-to-Place:</strong> Click/tap a pill in the Bank to select it (it will glow), then click/tap the matching slot in any house to place it.</li>
                <li><strong>Removing:</strong> Click the small "x" on a placed pill in the grid to return it to the bank.</li>
              </ul>

              <h3>Understanding Clues &amp; Validation</h3>
              <ul>
                <li><strong>Gray indicator (⚪):</strong> Undetermined. One or both attributes mentioned in the clue haven't been placed yet.</li>
                <li><strong>Green indicator (✅):</strong> Satisfied. The current layout correctly matches the clue.</li>
                <li><strong>Red indicator (❌):</strong> Violated. The current layout directly contradicts the clue.</li>
              </ul>

              <blockquote>
                <strong>Important Note on Left/Right:</strong> In the classic Zebra Puzzle, the clue <em>"The green house is on the left side of the white house"</em> means the green house is <strong>immediately</strong> to the left of the white house (Green is index $i$, White is index $i+1$).
              </blockquote>
            </div>
            <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnCloseModal}`} onClick={() => setShowHelpModal(false)}>Got it</button>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      {showVictoryModal && (
        <div className={`${styles.modal} ${styles.show}`} onClick={() => setShowVictoryModal(false)}>
          <div className={`${styles.modalContent} ${styles.victoryContent}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.victoryIcon}>🏆</div>
            <h2>Congratulations!</h2>
            <p className={styles.victoryMessage}>You have successfully solved the Zebra Puzzle! All clues are satisfied and your logical layout is 100% correct.</p>
            
            <div className={styles.victoryStats}>
              <p>Through pure logical deduction, you determined that:</p>
              <p style={{ marginTop: "0.65rem", fontSize: "1.25rem", fontWeight: "700", color: "#10b981" }}>
                The {fishOwner} owns the Fish!
              </p>
            </div>

            <div className={styles.victoryButtons}>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => {
                setShowVictoryModal(false);
                // Force a confirm reset via state
                setBoardState([
                  { color: null, nationality: null, drink: null, cigarette: null, pet: null },
                  { color: null, nationality: null, drink: null, cigarette: null, pet: null },
                  { color: null, nationality: null, drink: null, cigarette: null, pet: null },
                  { color: null, nationality: null, drink: null, cigarette: null, pet: null },
                  { color: null, nationality: null, drink: null, cigarette: null, pet: null }
                ]);
                setManualStrikes(new Set());
                setSelectedPill(null);
              }}>
                Play Again
              </button>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowVictoryModal(false)}>
                Review Board
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Confetti Canvas */}
      {showVictoryModal && <canvas ref={canvasRef} className={styles.confettiCanvas} />}
    </div>
  );
}
