
import React, { useState, useEffect, useCallback } from 'react';
import { Character, AbilityScores, ActionDetail, AttackSettings, ActionDamageEntry, ActionCategory, SkillProficiencies, Item, SavingThrowProficiencies, CharacterSheetModalProps, AdvantageDisadvantageSetting } from '../types';
import { DEFAULT_ABILITY_SCORES, DEFAULT_SKILL_PROFICIENCIES, DND_SKILLS_DEFINITIONS, DEFAULT_SAVING_THROW_PROFICIENCIES, DND_ABILITY_SCORES_LIST } from '../constants';
import {
    getAbilityModifier,
    calculateProficiencyBonus,
    calculateHitBonusString,
    formatDamageString,
    generateId,
    buildDamageRollCommand,
    getEffectiveAC
} from '../utils';

const labelClass = "block text-xs font-medium text-gray-300 mb-0.5";
const inputClass = "w-full p-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 text-xs";
const textareaClass = `${inputClass} resize-y min-h-[40px]`;
const readOnlyInputClass = "w-full p-1.5 bg-gray-800 border border-gray-700 rounded-md text-gray-400 cursor-default text-xs";
const sectionClass = "grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 mb-3";
const abilityScoreGridClass = "grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5";
const buttonClass = "px-3 py-1.5 text-xs font-medium rounded-md transition-colors";
const primaryButtonClass = `${buttonClass} bg-indigo-600 hover:bg-indigo-700 text-white`;
const secondaryButtonClass = `${buttonClass} bg-gray-600 hover:bg-gray-500 text-gray-200`;
const dangerButtonClass = `${buttonClass} bg-red-600 hover:bg-red-700 text-white`;
const tabButtonClass = (isActive: boolean) => 
    `px-3 py-1.5 text-xs font-medium focus:outline-none transition-colors duration-150 rounded-t-md
     ${isActive 
       ? 'border-l border-t border-r border-gray-700 bg-gray-750 text-indigo-400' 
       : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
     }`;


const emptyAction: Omit<ActionDetail, 'id'> = {
    name: '', description: '', actionCategory: 'action', isAttack: false,
    attackSettings: { ability: 'strength', proficient: true, bonus: 0 },
    range: '', target: '', damage: [], effects: [],
    spellLevel: undefined, castingTime: undefined, duration: undefined, components: undefined, school: undefined, isRitual: false,
    areaOfEffect: undefined, 
};

const availableActionCategories: ActionCategory[] = [
    'action', 'bonus_action', 'reaction', 'spell', 'feat', 'class_feature', 'racial_trait', 'other'
];
const spellLevelOptions = ["Cantrip", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];
const aoeTypeOptions: ActionDetail['areaOfEffect']['type'][] = ['sphere', 'cone', 'line', 'cube', 'cylinder'];


export const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({ 
    character, 
    isOpen, 
    onClose, 
    onSave, 
    isEditable, 
    onSendMessage, 
    setGlobalAdvantageState, // New prop
    activePlayerCharacterId // New prop
}) => {
  const [formData, setFormData] = useState<Partial<Character>>({});
  const [abilityScores, setAbilityScores] = useState<AbilityScores>(DEFAULT_ABILITY_SCORES);
  const [skillProficiencies, setSkillProficiencies] = useState<SkillProficiencies>(DEFAULT_SKILL_PROFICIENCIES);
  const [savingThrowProficiencies, setSavingThrowProficiencies] = useState<SavingThrowProficiencies>(DEFAULT_SAVING_THROW_PROFICIENCIES);
  const [actions, setActions] = useState<ActionDetail[]>([]);
  const [spellSlots, setSpellSlots] = useState<Character['spellSlots']>({});
  const [hitDiceData, setHitDiceData] = useState<Character['hitDice']>({current:1, max:1, dieType: 'd8'});
  const [instanceNotes, setInstanceNotes] = useState<string>(''); // For NPC instance notes

  const [activeNpcTab, setActiveNpcTab] = useState<'stats' | 'actions' | 'details'>('stats');


  useEffect(() => {
    if (character) {
      setFormData({
        name: character.name, race: character.race, class: character.class, subclass: character.subclass || '', level: character.level || 1,
        maxHp: character.maxHp, currentHp: character.currentHp, temporaryHp: character.temporaryHp || 0,
        armorClass: character.armorClass, speed: character.speed, notes: character.notes,
        spellcastingAbility: character.spellcastingAbility,
        spellSaveDC: character.spellSaveDC, spellAttackBonus: character.spellAttackBonus,
        alignment: character.alignment, background: character.background,
        personalityTraits: character.personalityTraits, ideals: character.ideals,
        bonds: character.bonds, flaws: character.flaws, appearanceDescription: character.appearanceDescription,
        itemIds: character.itemIds || [],
        languages: character.languages || '',
        weaponProficiencies: character.weaponProficiencies || '',
        armorProficiencies: character.armorProficiencies || '',
        toolProficiencies: character.toolProficiencies || '',
        senses: character.senses || '',
        initiative: character.initiative, 
      });
      setAbilityScores(character.abilityScores || DEFAULT_ABILITY_SCORES);
      setSkillProficiencies(character.skillProficiencies || DEFAULT_SKILL_PROFICIENCIES);
      setSavingThrowProficiencies(character.savingThrowProficiencies || DEFAULT_SAVING_THROW_PROFICIENCIES);
      setActions(character.actions ? JSON.parse(JSON.stringify(character.actions.map(a => ({...emptyAction, ...a})))) : []);
      setSpellSlots(character.spellSlots || {});
      setHitDiceData(character.hitDice || {current: character.level || 1, max: character.level || 1, dieType: 'd8'});
      setInstanceNotes(character.instanceNotes || '');
      if (character.isNPC) setActiveNpcTab('stats'); 
    } else {
      setFormData({}); 
      setAbilityScores(DEFAULT_ABILITY_SCORES); 
      setSkillProficiencies(DEFAULT_SKILL_PROFICIENCIES);
      setSavingThrowProficiencies(DEFAULT_SAVING_THROW_PROFICIENCIES);
      setActions([]); 
      setSpellSlots({});
      setHitDiceData({current:1, max:1, dieType: 'd8'});
      setInstanceNotes('');
    }
  }, [character]);

  if (!isOpen || !character) return null;

  const currentCharacterStatsForCalc = {
    abilityScores: abilityScores,
    level: formData.level || character.level || 1,
    proficiencyBonus: character.proficiencyBonus || calculateProficiencyBonus(formData.level || character.level || 1),
  };
  
  const effectiveACForDisplay = getEffectiveAC(character);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let numValue: string | number | undefined = value;
    if (type === 'number') {
        numValue = value === '' ? undefined : parseInt(value, 10);
        if (name === 'initiative' && numValue === undefined && value === '') {
        } else if (name === 'initiative' && (isNaN(numValue as number) || numValue === undefined)) {
          return; 
        }
    }
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };
  
  const handleAbilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAbilityScores(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleSkillProficiencyChange = (skillName: keyof SkillProficiencies) => {
    if (!isEditable) return;
    setSkillProficiencies(prev => ({...prev, [skillName]: !prev[skillName]}));
  };

  const handleSavingThrowProficiencyChange = (abilityName: keyof AbilityScores) => {
    if (!isEditable) return;
    setSavingThrowProficiencies(prev => ({...prev, [abilityName]: !prev[abilityName]}));
  };

  const handleSpellSlotChange = (level: string, type: 'current' | 'max', value: string) => {
    if (!isEditable) return;
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) && value !== '') return;

    setSpellSlots(prev => {
        const levelKey = level.match(/\d+/)?.[0] || level.toLowerCase(); 
        const currentLevelSlots = prev?.[levelKey] || { current: 0, max: 0 };
        return {
            ...prev,
            [levelKey]: {
                ...currentLevelSlots,
                [type]: value === '' ? 0 : Math.max(0, numValue) 
            }
        };
    });
  };

  const handleHitDiceChange = (field: keyof Character['hitDice'], value: string | number) => {
    if(!isEditable) return;
    setHitDiceData(prev => {
        if (!prev) return { current: 0, max: 0, dieType: 'd8', [field as string]: value }; 
        const newHD = {...prev};
        if (typeof value === 'string' && field === 'dieType') {
            newHD.dieType = value;
        } else if (typeof value === 'number' && (field === 'current' || field === 'max')) {
            newHD[field] = Math.max(0, value);
        } else if (typeof value === 'string' && (field === 'current' || field === 'max')) {
            newHD[field] = Math.max(0, parseInt(value) || 0);
        }
        return newHD;
    });
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditable) return;

    const updatedCharacterData: Character = {
      ...character, 
      ...formData,  
      level: formData.level || character.level || 1, 
      maxHp: formData.maxHp || character.maxHp || 0,
      currentHp: formData.currentHp ?? character.currentHp ?? 0, 
      temporaryHp: formData.temporaryHp || 0,
      armorClass: formData.armorClass || character.armorClass || 0,
      speed: formData.speed || character.speed || 0,
      initiative: formData.initiative, 
      abilityScores: abilityScores,
      skillProficiencies: skillProficiencies,
      savingThrowProficiencies: savingThrowProficiencies,
      actions: actions,
      proficiencyBonus: currentCharacterStatsForCalc.proficiencyBonus,
      spellSlots: spellSlots,
      itemIds: formData.itemIds || [],
      notes: formData.notes || '',
      instanceNotes: character.isNPC ? instanceNotes : character.instanceNotes, 
      languages: formData.languages || '',
      weaponProficiencies: formData.weaponProficiencies || '',
      armorProficiencies: formData.armorProficiencies || '',
      toolProficiencies: formData.toolProficiencies || '',
      hitDice: hitDiceData,
      senses: formData.senses || '',
      subclass: formData.subclass || '',
      deathSaves: character.deathSaves || {successes: 0, failures: 0},
      temporaryEffects: character.temporaryEffects || [], // Preserve temporary effects
    };
    onSave(updatedCharacterData);
  };

  const getInputClass = (customReadOnly?: boolean) => (isEditable && !customReadOnly) ? inputClass : readOnlyInputClass;

  const handleAddAction = () => { if (!isEditable) return; setActions(prev => [...prev, { ...emptyAction, id: generateId('action_'), damage: [{id: generateId('dmg_'), dice: '1d6', type: 'Bludgeoning'}] }]); };
  const handleRemoveAction = (actionId: string) => { if (!isEditable) return; setActions(prev => prev.filter(a => a.id !== actionId)); };
  const handleActionChange = (actionId: string, field: keyof ActionDetail, value: any) => { if (!isEditable) return; setActions(prev => prev.map(a => a.id === actionId ? { ...a, [field]: value } : a)); };
  const handleActionCategoryChange = (actionId: string, value: ActionCategory) => { if (!isEditable) return; handleActionChange(actionId, 'actionCategory', value); };
  const handleAttackSettingChange = (actionId: string, field: keyof AttackSettings, value: any) => { if (!isEditable) return; setActions(prev => prev.map(a => { if (a.id === actionId) { const newAttackSettings = { ...(a.attackSettings || emptyAction.attackSettings!), [field]: value }; if (field === 'ability' && value === 'none') newAttackSettings.proficient = false; return { ...a, attackSettings: newAttackSettings }; } return a; })); };
  const handleAddDamageEntry = (actionId: string) => { if (!isEditable) return; setActions(prev => prev.map(a => a.id === actionId ? { ...a, damage: [...(a.damage || []), { id: generateId('dmg_'), dice: '1d4', type: 'Piercing' }] } : a)); };
  const handleRemoveDamageEntry = (actionId: string, damageId: string) => { if (!isEditable) return; setActions(prev => prev.map(a => a.id === actionId ? { ...a, damage: (a.damage || []).filter(d => d.id !== damageId) } : a)); };
  const handleDamageEntryChange = (actionId: string, damageId: string, field: keyof ActionDamageEntry, value: string) => { if (!isEditable) return; setActions(prev => prev.map(a => a.id === actionId ? { ...a, damage: (a.damage || []).map(d => d.id === damageId ? { ...d, [field]: value } : d) } : a)); };
  const handleAddEffect = (actionId: string) => { if (!isEditable) return; setActions(prev => prev.map(a => a.id === actionId ? { ...a, effects: [...(a.effects || []), "New effect"] } : a)); };
  const handleRemoveEffect = (actionId: string, effectIndex: number) => { if (!isEditable) return; setActions(prev => prev.map(a => a.id === actionId ? { ...a, effects: (a.effects || []).filter((_, idx) => idx !== effectIndex) } : a)); };
  const handleEffectChange = (actionId: string, effectIndex: number, value: string) => { if (!isEditable) return; setActions(prev => prev.map(a => { if (a.id === actionId) { const newEffects = [...(a.effects || [])]; newEffects[effectIndex] = value; return { ...a, effects: newEffects }; } return a; })); };
  const handleSpellComponentChange = (actionId: string, component: 'V' | 'S', checked: boolean) => { if (!isEditable) return; setActions(prev => prev.map(a => a.id === actionId ? { ...a, components: { ...(a.components || {}), [component]: checked } } : a)); };
  const handleSpellMaterialComponentChange = (actionId: string, MValue: string) => { if (!isEditable) return; setActions(prev => prev.map(a => a.id === actionId ? { ...a, components: { ...(a.components || {}), M: MValue } } : a)); };
  const handleAoeChange = (actionId: string, field: keyof NonNullable<ActionDetail['areaOfEffect']>, value: any) => { if (!isEditable) return; setActions(prevActions => prevActions.map(a => { if (a.id === actionId) { const currentAoe = a.areaOfEffect || { type: 'sphere', size: 0 }; let newAoe = { ...currentAoe, [field]: value }; if (field === 'type' && String(value) === 'none') { return { ...a, areaOfEffect: undefined }; } if (field === 'size' || field === 'sizeY') { newAoe[field] = parseInt(value, 10) || 0; } return { ...a, areaOfEffect: newAoe }; } return a; })); };

  const handleNpcActionClick = (action: ActionDetail) => {
    if (!character?.isNPC || !onSendMessage) return; // isEditable check removed, DM can always use NPC actions

    // Announce the action
    onSendMessage(`${character.name} uses ${action.name}. Effect: ${action.description.substring(0, 80)}${action.description.length > 80 ? '...' : ''}`, 'info');
    
    if (action.isAttack && action.attackSettings) {
        const hitBonusString = calculateHitBonusString(action.attackSettings, currentCharacterStatsForCalc);
        const command = `/roll 1d20${hitBonusString} for ${character.name}'s ${action.name} attack`;
        onSendMessage(command, 'roll');
    }
    
    // If the action imposes disadvantage and there's an active player character, set the toggle.
    // This is a simplification: assumes the DM is targeting the active player character.
    if (action.imposesDisadvantageOnTargetNextAttack && activePlayerCharacterId && setGlobalAdvantageState) {
        setGlobalAdvantageState('disadvantage');
        onSendMessage(`(System: ${activePlayerCharacterId} will have disadvantage on their next attack roll from ${action.name})`, 'info');
    }
  };

  const handleNpcDamageClick = (action: ActionDetail, damageEntry: ActionDamageEntry) => {
    if (!character?.isNPC || !onSendMessage || !action.damage) return;
    const command = buildDamageRollCommand([damageEntry], abilityScores, false); 
    onSendMessage(`${command} for ${character.name}'s ${action.name} (${damageEntry.type} damage)`, 'roll');
  };

  const handleNpcSaveRoll = (abilityKey: keyof AbilityScores, modifier: number) => {
    if (!character?.isNPC || !onSendMessage) return;
    const abilityName = abilityKey.charAt(0).toUpperCase() + abilityKey.slice(1);
    const command = `/roll 1d20${modifier >= 0 ? '+' : ''}${modifier} for ${character.name}'s ${abilityName} Save`;
    onSendMessage(command, 'roll');
  };
  
  const handleNpcSkillRoll = (skillName: string, modifier: number) => {
    if (!character?.isNPC || !onSendMessage) return;
    const command = `/roll 1d20${modifier >= 0 ? '+' : ''}${modifier} for ${character.name}'s ${skillName} Check`;
    onSendMessage(command, 'roll');
  };


  const renderNpcStatsCombatTab = () => {
    const dexModifier = getAbilityModifier(abilityScores.dexterity);
    return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><label htmlFor="currentHp" className={labelClass}>Current HP</label><input type="number" name="currentHp" id="currentHp" value={formData.currentHp ?? ''} onChange={handleChange} className={getInputClass()} /></div>
        <div><label htmlFor="maxHp" className={labelClass}>Max HP</label><input type="number" name="maxHp" id="maxHp" value={formData.maxHp || ''} onChange={handleChange} className={getInputClass(true)} readOnly={!isEditable && character.sourceTemplateId !== undefined} /></div>
        <div><label htmlFor="temporaryHp" className={labelClass}>Temp HP</label><input type="number" name="temporaryHp" id="temporaryHp" value={formData.temporaryHp || ''} onChange={handleChange} className={getInputClass()} /></div>
        <div><label htmlFor="armorClass" className={labelClass}>AC</label><input type="text" name="armorClass" id="armorClass" value={effectiveACForDisplay} className={getInputClass(true)} readOnly /></div>
        <div><label htmlFor="speed" className={labelClass}>Speed</label><input type="text" name="speed" id="speed" value={formData.speed || ''} onChange={handleChange} className={getInputClass(true)} readOnly={!isEditable && character.sourceTemplateId !== undefined}/></div>
        <div>
            <label htmlFor="initiative" className={labelClass}>
                Initiative <span className="text-gray-400 text-xxs">(DEX Mod: {dexModifier >= 0 ? '+' : ''}{dexModifier})</span>
            </label>
            <input 
                type="number" 
                name="initiative" 
                id="initiative" 
                value={formData.initiative ?? ''} 
                onChange={handleChange} 
                className={getInputClass()} 
                placeholder={`e.g. ${10 + dexModifier}`}
            />
        </div>
        <div><label className={labelClass}>Prof. Bonus</label><input type="text" value={`+${currentCharacterStatsForCalc.proficiencyBonus}`} className={readOnlyInputClass} readOnly /></div>
      </div>
      
      <fieldset className="p-3 border border-gray-700 rounded-md bg-gray-800/20">
        <legend className="text-md font-medium text-indigo-200 px-1">Ability Scores</legend>
        <div className={abilityScoreGridClass}>
            {DND_ABILITY_SCORES_LIST.map(scoreName => (
            <div key={scoreName}>
                <label htmlFor={scoreName} className={`${labelClass} capitalize`}>{scoreName} ({getAbilityModifier(abilityScores[scoreName]) >=0 ? '+':''}{getAbilityModifier(abilityScores[scoreName])})</label>
                <input type="number" name={scoreName} id={scoreName} value={abilityScores[scoreName]} onChange={handleAbilityChange} className={getInputClass(true)} readOnly={!isEditable && character.sourceTemplateId !== undefined} min="1" max="30" />
            </div>
            ))}
        </div>
      </fieldset>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <fieldset className="p-3 border border-gray-700 rounded-md bg-gray-800/20">
                <legend className="text-md font-medium text-indigo-200 px-1">Saving Throws</legend>
                <div className="space-y-1.5">
                {DND_ABILITY_SCORES_LIST.map(abilityName => {
                    const isProf = savingThrowProficiencies?.[abilityName] || false;
                    const modifier = getAbilityModifier(abilityScores[abilityName]) + (isProf ? currentCharacterStatsForCalc.proficiencyBonus : 0);
                    return ( 
                      <div key={`save-${abilityName}`} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input type="checkbox" id={`save-prof-${abilityName}`} checked={isProf} onChange={() => handleSavingThrowProficiencyChange(abilityName)} disabled={!isEditable} className="form-checkbox h-3.5 w-3.5 text-indigo-500 bg-gray-600 border-gray-500 rounded mr-2 disabled:opacity-50"/>
                            <span 
                                className="capitalize text-xs text-gray-200 cursor-pointer hover:text-indigo-300"
                                title={`Roll ${abilityName} Save`}
                                onClick={() => handleNpcSaveRoll(abilityName, modifier)}
                            >
                                {abilityName}
                            </span>
                        </div>
                        <span 
                            className={`font-semibold text-xs ml-2 cursor-pointer hover:underline ${modifier >= 0 ? 'text-green-400' : 'text-red-400'}`}
                            title={`Roll ${abilityName} Save: 1d20 ${modifier >=0 ? '+':''}${modifier}`}
                            onClick={() => handleNpcSaveRoll(abilityName, modifier)}
                        >
                            {modifier >= 0 ? '+' : ''}{modifier}
                        </span>
                      </div> 
                    );
                })}
                </div>
            </fieldset>
            <fieldset className="p-3 border border-gray-700 rounded-md bg-gray-800/20">
                <legend className="text-md font-medium text-indigo-200 px-1">Skills</legend>
                <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700 pr-1">
                {DND_SKILLS_DEFINITIONS.map(skillDef => {
                    const isProf = skillProficiencies?.[skillDef.id] || false;
                    const templateSkillKey = skillDef.name.toLowerCase().replace(/\s+/g, '');
                    const templateSkillBonus = character.sourceTemplateId ? (character as any).skills?.[templateSkillKey] : undefined;

                    let modifier: number;
                    if (templateSkillBonus !== undefined) {
                        modifier = templateSkillBonus; 
                    } else {
                        modifier = getAbilityModifier(abilityScores[skillDef.ability]) + (isProf ? currentCharacterStatsForCalc.proficiencyBonus : 0);
                    }
                    return ( 
                      <div key={skillDef.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input type="checkbox" id={`skill-${skillDef.id}`} checked={isProf || templateSkillBonus !== undefined} onChange={() => handleSkillProficiencyChange(skillDef.id)} disabled={!isEditable || templateSkillBonus !== undefined} className="form-checkbox h-3.5 w-3.5 text-indigo-500 bg-gray-600 border-gray-500 rounded mr-2 disabled:opacity-50"/>
                            <span 
                                className="text-xs text-gray-200 cursor-pointer hover:text-indigo-300"
                                title={`Roll ${skillDef.name} Check`}
                                onClick={() => handleNpcSkillRoll(skillDef.name, modifier)}
                            >
                                {skillDef.name} <span className="text-gray-500 text-xxs">({skillDef.ability.slice(0,3)})</span>
                            </span>
                          </div>
                          <span 
                            className={`font-semibold text-xs ml-2 cursor-pointer hover:underline ${modifier >= 0 ? 'text-green-400' : 'text-red-400'}`}
                            title={`Roll ${skillDef.name} Check: 1d20 ${modifier >=0 ? '+':''}${modifier}`}
                            onClick={() => handleNpcSkillRoll(skillDef.name, modifier)}
                          >
                              {modifier >= 0 ? '+' : ''}{modifier}
                          </span>
                      </div> 
                    );
                })}
                </div>
            </fieldset>
        </div>
        <div><label className={labelClass}>Senses</label><input type="text" name="senses" value={formData.senses || ''} onChange={handleChange} className={getInputClass(true)} readOnly={!isEditable && character.sourceTemplateId !== undefined} placeholder="e.g. Darkvision 60ft, Passive Perception 12"/></div>
    </div>
  )};

  const renderNpcActionsAbilitiesTab = () => (
    <div className="space-y-3">
        {isEditable && <div className="flex justify-end"><button type="button" onClick={handleAddAction} className={primaryButtonClass}>Add New Action/Ability</button></div>}
        {actions.length === 0 && <p className="text-gray-500 italic">No actions or abilities defined.</p>}
        {actions.map((action) => (
            <div key={action.id} className="p-2.5 bg-gray-750 rounded-md border border-gray-600">
                {isEditable ? ( 
                     <>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-x-3 gap-y-1.5 mb-2 items-start">
                            <div className="md:col-span-2"><label htmlFor={`actionName-${action.id}`} className={labelClass}>Name</label><input type="text" id={`actionName-${action.id}`} value={action.name} onChange={(e) => handleActionChange(action.id, 'name', e.target.value)} className={inputClass}/></div>
                            <div><label htmlFor={`actionCategory-${action.id}`} className={labelClass}>Category</label><select id={`actionCategory-${action.id}`} value={action.actionCategory || 'other'} onChange={(e) => handleActionCategoryChange(action.id, e.target.value as ActionCategory)} className={inputClass}>{availableActionCategories.map(cat => <option key={cat} value={cat}>{cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}</select></div>
                            <div className="flex items-center space-x-3 pt-5"><label className="flex items-center text-xs text-gray-300"><input type="checkbox" checked={action.isAttack || false} onChange={(e) => handleActionChange(action.id, 'isAttack', e.target.checked)} className="form-checkbox h-3.5 w-3.5"/> Is Attack?</label></div>
                            <div className="pt-5 flex justify-end"><button type="button" onClick={() => handleRemoveAction(action.id)} className={`${dangerButtonClass} ml-auto text-xxs px-2 py-1`}>Remove</button></div>
                        </div>
                        <div><label htmlFor={`actionDesc-${action.id}`} className={labelClass}>Description</label><textarea id={`actionDesc-${action.id}`} value={action.description} rows={2} onChange={(e) => handleActionChange(action.id, 'description', e.target.value)} className={textareaClass}/></div>
                    </>
                ) : ( 
                <div className="cursor-pointer" onClick={() => onSendMessage && handleNpcActionClick(action)}>
                    <h4 className="font-semibold text-indigo-300 hover:text-indigo-100">{action.name} <span className="text-xs text-gray-400">({action.actionCategory?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Ability'})</span></h4>
                    <p className="text-xs text-gray-300 whitespace-pre-wrap mb-1">{action.description}</p>
                    {action.source && <p className="text-xxs text-gray-500 italic mt-0.5">Source: {action.source}</p>}
                    {action.isAttack && (
                        <div className="mt-1 text-xs">
                            <p><span className="font-medium text-gray-400">Attack: </span><span className="text-green-300 font-bold">{calculateHitBonusString(action.attackSettings, currentCharacterStatsForCalc)}</span>
                               {action.range && <span className="ml-2"><span className="font-medium text-gray-400">Range:</span> {action.range}</span>}
                               {action.target && <span className="ml-2"><span className="font-medium text-gray-400">Target:</span> {action.target}</span>}
                            </p>
                            {action.damage && action.damage.length > 0 && (
                            <p>
                                <span className="font-medium text-gray-400">Damage: </span>
                                {action.damage.map((d, idx) => (
                                    <span key={d.id} onClick={(e) => { e.stopPropagation(); onSendMessage && handleNpcDamageClick(action, d);}} className="text-red-300 hover:text-red-100 underline cursor-pointer mr-1.5">
                                        {formatDamageString(d, abilityScores)}
                                    </span>
                                ))}
                            </p>
                            )}
                            {action.effects && action.effects.length > 0 && (<div><span className="font-medium text-gray-400">Effects:</span><ul className="list-disc list-inside ml-1 text-gray-300 text-xxs">{action.effects.map((effect, idx) => <li key={idx}>{effect}</li>)}</ul></div>)}
                        </div>
                    )}
                    {action.actionCategory === 'spell' && (
                       <div className="mt-1 text-xs space-y-0.5">
                            <p><span className="font-semibold text-gray-400">Level:</span> {action.spellLevel || 'N/A'} {action.school && `(${action.school})`} {action.isRitual && <span className="text-sky-400">(Ritual)</span>}</p>
                            {action.castingTime && <p><span className="font-semibold text-gray-400">Cast Time:</span> {action.castingTime}</p>}
                            {action.range && <p><span className="font-semibold text-gray-400">Range:</span> {action.range}</p>}
                            {action.duration && <p><span className="font-semibold text-gray-400">Duration:</span> {action.duration}</p>}
                            {action.components && (<p><span className="font-semibold text-gray-400">Components:</span> {action.components.V && "V "}{action.components.S && "S "}{action.components.M && `M (${action.components.M})`}</p>)}
                            {action.areaOfEffect && (<p><span className="font-semibold text-gray-400">Area:</span> {action.areaOfEffect.description || `${action.areaOfEffect.size}ft ${action.areaOfEffect.type}${action.areaOfEffect.sizeY ? ` x ${action.areaOfEffect.sizeY}ft` : ''}`}</p>)}
                            {action.damage && action.damage.length > 0 && (
                                <p><span className="font-medium text-gray-400">Damage/Effect: </span>
                                {action.damage.map((d, idx) => ( <span key={d.id} onClick={(e) => { e.stopPropagation(); onSendMessage && handleNpcDamageClick(action, d); }} className="text-red-300 hover:text-red-100 underline cursor-pointer mr-1.5">{formatDamageString(d, abilityScores)}</span> ))}
                                </p>
                            )}
                            {action.effects && action.effects.length > 0 && (!action.damage?.length || action.damage.length ===0) && (<div><span className="font-medium text-gray-400">Effects:</span><ul className="list-disc list-inside ml-1 text-gray-300 text-xxs">{action.effects.map((effect, idx) => <li key={idx}>{effect}</li>)}</ul></div>)}
                        </div>
                    )}
                </div>
                )}
            </div>
        ))}
    </div>
  );
  
  const renderNpcDetailsNotesTab = () => (
    <div className="space-y-3">
        <div><label className={labelClass}>Description (from Template/Notes)</label><textarea value={character.notes || ''} className={readOnlyInputClass} rows={4} readOnly /></div>
        <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Type/Race</label><input type="text" value={character.race || 'Unknown'} className={readOnlyInputClass} readOnly /></div>
            <div><label className={labelClass}>Alignment</label><input type="text" value={character.alignment || 'Unknown'} className={readOnlyInputClass} readOnly /></div>
        </div>
        <div><label className={labelClass}>Languages</label><input type="text" value={character.languages || 'None'} className={readOnlyInputClass} readOnly /></div>
        <div>
            <label htmlFor="instanceNotes" className={labelClass}>DM Instance Notes</label>
            <textarea name="instanceNotes" id="instanceNotes" rows={3} value={instanceNotes} onChange={(e) => setInstanceNotes(e.target.value)} className={getInputClass()} readOnly={!isEditable} placeholder="Notes specific to this instance of the NPC..."/>
        </div>
    </div>
  );


  return (
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-75 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-indigo-400">{isEditable ? "Edit" : "View"} {character.isNPC ? "NPC" : "Character"}: {character.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl sm:text-3xl leading-none">&times;</button>
        </div>

        {character.isNPC && (
            <div className="mb-3 border-b border-gray-700 flex-shrink-0">
                <button onClick={() => setActiveNpcTab('stats')} className={`${tabButtonClass(activeNpcTab === 'stats')} `}>Stats & Combat</button>
                <button onClick={() => setActiveNpcTab('actions')} className={`${tabButtonClass(activeNpcTab === 'actions')} ml-1`}>Actions & Abilities</button>
                <button onClick={() => setActiveNpcTab('details')} className={`${tabButtonClass(activeNpcTab === 'details')} ml-1`}>Details & Notes</button>
            </div>
        )}
        
        <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-2">
            <form onSubmit={handleSubmit}>
                { character.isNPC ? (
                    <>
                        {activeNpcTab === 'stats' && renderNpcStatsCombatTab()}
                        {activeNpcTab === 'actions' && renderNpcActionsAbilitiesTab()}
                        {activeNpcTab === 'details' && renderNpcDetailsNotesTab()}
                    </>
                ) : (
                    <>
                        <fieldset className="mb-4 p-3 border border-gray-700 rounded-md bg-gray-800/30">
                            <legend className="text-lg font-medium text-indigo-300 px-1">Core Information</legend>
                            <div className={sectionClass}>
                            <div><label htmlFor="name" className={labelClass}>Name</label><input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} className={getInputClass()} readOnly={!isEditable} /></div>
                            <div><label htmlFor="level" className={labelClass}>Level</label><input type="number" name="level" id="level" value={formData.level || ''} onChange={handleChange} className={getInputClass()} readOnly={!isEditable} min="1" /></div>
                            </div>
                             <div className={sectionClass}>
                                <div><label htmlFor="race" className={labelClass}>Race</label><input type="text" name="race" id="race" value={formData.race || ''} onChange={handleChange} className={getInputClass()} readOnly={!isEditable} /></div>
                                <div><label htmlFor="class" className={labelClass}>Class</label><input type="text" name="class" id="class" value={formData.class || ''} onChange={handleChange} className={getInputClass()} readOnly={!isEditable} /></div>
                            </div>
                        </fieldset>
                         <fieldset className="mb-4 p-3 border border-gray-700 rounded-md bg-gray-800/30">
                            <legend className="text-lg font-medium text-indigo-300 px-1">Ability Scores</legend>
                            <div className={abilityScoreGridClass}>
                            {(Object.keys(abilityScores) as Array<keyof AbilityScores>).map(scoreName => (
                                <div key={scoreName}>
                                <label htmlFor={scoreName} className={`${labelClass} capitalize`}>{scoreName} ({getAbilityModifier(abilityScores[scoreName]) >=0 ? '+':''}{getAbilityModifier(abilityScores[scoreName])})</label>
                                <input type="number" name={scoreName} id={scoreName} value={abilityScores[scoreName]} onChange={handleAbilityChange} className={getInputClass()} readOnly={!isEditable} min="1" max="30" />
                                </div>
                            ))}
                            </div>
                        </fieldset>
                    </>
                )}

                {isEditable && (
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700 flex-shrink-0">
                    <button type="button" onClick={onClose} className={secondaryButtonClass}>Cancel</button>
                    <button type="submit" className={primaryButtonClass}>Save {character.isNPC ? "NPC" : "Character"}</button>
                    </div>
                )}
            </form>
        </div>
      </div>
    </div>
  );
};
