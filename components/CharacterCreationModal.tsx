

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AbilityScores, CharacterCreationData, CharacterCreationTabName, RaceDetail, ClassDetail, BackgroundDetail, SkillProficiencies, FeatDetail, AbilityScoreGenerationMethod, ClassFeatureChoice, ActionDetail, SkillDefinition, LanguageDefinition, EquipmentChoice, EquipmentOption } from '../types';
import {
  DEFAULT_ABILITY_SCORES,
  DND_RACES_DETAILED,
  DND_CLASSES_DETAILED,
  DND_BACKGROUNDS_DETAILED,
  DND_LANGUAGES_DEFINITIONS,
  DND_LANGUAGES_OPTION_LIST,
  DND_TOOL_PROFICIENCIES_LIST,
  DND_SKILLS_DEFINITIONS,
  DND_SKILLS_OPTION_LIST,
  DND_FEATS_DETAILED,
  DND_ABILITY_SCORES_LIST,
  DEFAULT_SKILL_PROFICIENCIES,
  DND_STANDARD_ARRAY,
} from '../constants';
import { getAbilityModifier, calculateProficiencyBonus, generateId } from '../utils';

interface CharacterCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CharacterCreationData) => void;
}

const tabButtonClass = "px-4 py-2 text-sm font-medium focus:outline-none transition-colors duration-150 whitespace-nowrap flex items-center";
const activeTabButtonClass = "border-b-2 border-indigo-500 text-indigo-300 bg-gray-750";
const inactiveTabButtonClass = "text-gray-400 hover:text-gray-200 hover:bg-gray-700";

const listItemClass = "p-2.5 rounded-md hover:bg-indigo-700/30 cursor-pointer transition-colors";
const activeListItemClass = "bg-indigo-600/50 ring-1 ring-indigo-400";

const sectionTitleClass = "text-lg font-semibold text-indigo-300 mb-2";
const flavorTextClass = "text-sm text-gray-300 italic mb-3 whitespace-pre-line";
const mechanicalEffectClass = "text-xs text-gray-200";
const choiceSectionClass = "mt-3 p-2.5 bg-gray-800/50 rounded-md border border-gray-600/50";
const choiceLabelClass = "block text-xs font-medium text-gray-300 mb-1";
const choiceSelectClass = "w-full p-1.5 bg-gray-700 border border-gray-600 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed";
const choiceCheckboxLabelClass = "flex items-center text-xs text-gray-200 hover:text-indigo-300 cursor-pointer";
const choiceCheckboxClass = "form-checkbox h-3.5 w-3.5 text-indigo-500 bg-gray-600 border-gray-500 rounded mr-2 disabled:opacity-50 disabled:cursor-not-allowed";
const radioLabelClass = "flex items-center text-sm text-gray-200 cursor-pointer";
const radioInputClass = "form-radio h-4 w-4 text-indigo-500 bg-gray-600 border-gray-500 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed";
const detailPreviewBoxClass = "mt-2 p-2 bg-gray-900/70 border border-gray-600 rounded-md text-xs min-h-[120px] overflow-y-auto";


export const CharacterCreationModal: React.FC<CharacterCreationModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [currentTab, setCurrentTab] = useState<CharacterCreationTabName>('race');

  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(DND_RACES_DETAILED[0]?.id || null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null);
  const [selectedFeatId, setSelectedFeatId] = useState<string | null>(null);

  const [characterName, setCharacterName] = useState('');

  const [abilityScoreMethod, setAbilityScoreMethod] = useState<AbilityScoreGenerationMethod>('standardArray');
  const [manualAbilityScores, setManualAbilityScores] = useState<AbilityScores>({...DEFAULT_ABILITY_SCORES});
  const [assignedStandardArrayScores, setAssignedStandardArrayScores] = useState<Partial<Record<keyof AbilityScores, number | undefined>>>({});
  const [standardArrayPool, setStandardArrayPool] = useState<number[]>([...DND_STANDARD_ARRAY]);
  const [rolledScores, setRolledScores] = useState<number[] | null>(null);
  const [assignedRolledScores, setAssignedRolledScores] = useState<Partial<Record<keyof AbilityScores, number | undefined>>>({});
  const [rolledScoresPool, setRolledScoresPool] = useState<number[]>([]);
  const [rolledStatsLocked, setRolledStatsLocked] = useState<boolean>(false);

  const [chosenRaceLanguages, setChosenRaceLanguages] = useState<string[]>([]);
  const [chosenBackgroundLanguages, setChosenBackgroundLanguages] = useState<string[]>([]);
  const [chosenRaceSkills, setChosenRaceSkills] = useState<Set<keyof SkillProficiencies>>(new Set());
  const [chosenClassSkills, setChosenClassSkills] = useState<Set<keyof SkillProficiencies>>(new Set());
  const [chosenFeatSkills, setChosenFeatSkills] = useState<Set<keyof SkillProficiencies>>(new Set());
  const [chosenVariantHumanASIs, setChosenVariantHumanASIs] = useState<(keyof AbilityScores)[]>([]);
  const [chosenBackgroundTools, setChosenBackgroundTools] = useState<Record<number, string>>({});
  const [chosenClassTools, setChosenClassTools] = useState<Set<string>>(new Set());
  const [chosenFeatTools, setChosenFeatTools] = useState<Set<string>>(new Set());
  const [chosenClassFeatureSelections, setChosenClassFeatureSelections] = useState<Record<string, string[]>>({});
  const [chosenStartingEquipment, setChosenStartingEquipment] = useState<Record<string, string>>({}); // choiceId -> equipmentOptionId
  const [finalEquipmentList, setFinalEquipmentList] = useState<string[]>([]);


  const [tabValidity, setTabValidity] = useState<Record<CharacterCreationTabName, boolean>>({
    race: false, class: false, background: false, abilities: false, inventory: false, details: false,
  });

  const [globallySelectedSkills, setGloballySelectedSkills] = useState<Set<keyof SkillProficiencies>>(new Set());
  const [globallySelectedTools, setGloballySelectedTools] = useState<Set<string>>(new Set());
  const [globallySelectedLanguages, setGloballySelectedLanguages] = useState<Set<string>>(new Set());

  const [previewedSkillId, setPreviewedSkillId] = useState<keyof SkillProficiencies | null>(null);
  const [previewedLanguageId, setPreviewedLanguageId] = useState<string | null>(null);
  const [previewedClassFeatureOption, setPreviewedClassFeatureOption] = useState<Pick<ActionDetail, 'id' | 'name' | 'description' | 'source'> | null>(null);

  // Effect to clear previews when the main tab changes
  useEffect(() => {
    setPreviewedSkillId(null);
    setPreviewedLanguageId(null);
    setPreviewedClassFeatureOption(null);
  }, [currentTab]);

  const showSkillPreview = useCallback((skillId: keyof SkillProficiencies) => {
    setPreviewedLanguageId(null);
    setPreviewedClassFeatureOption(null);
    setPreviewedSkillId(skillId);
  }, []); 

  const showLanguagePreview = useCallback((languageId: string) => {
    setPreviewedSkillId(null);
    setPreviewedClassFeatureOption(null);
    setPreviewedLanguageId(languageId);
  }, []); 

  const showClassFeatureOptionPreview = useCallback((option: Pick<ActionDetail, 'id' | 'name' | 'description' | 'source'>) => {
    setPreviewedSkillId(null);
    setPreviewedLanguageId(null);
    setPreviewedClassFeatureOption(option);
  }, []); 


  const TABS: { id: CharacterCreationTabName; label: string }[] = [
    { id: 'race', label: 'Race' },
    { id: 'class', label: 'Class' },
    { id: 'background', label: 'Background' },
    { id: 'abilities', label: 'Abilities' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'details', label: 'Details' },
  ];

  const selectedRace = useMemo(() => DND_RACES_DETAILED.find(r => r.id === selectedRaceId), [selectedRaceId]);
  const selectedClass = useMemo(() => DND_CLASSES_DETAILED.find(c => c.id === selectedClassId), [selectedClassId]);
  const selectedBackground = useMemo(() => DND_BACKGROUNDS_DETAILED.find(b => b.id === selectedBackgroundId), [selectedBackgroundId]);
  const selectedFeat = useMemo(() => DND_FEATS_DETAILED.find(f => f.id === selectedFeatId), [selectedFeatId]);

  useEffect(() => {
    setChosenRaceLanguages([]); setChosenRaceSkills(new Set()); setChosenVariantHumanASIs([]); setSelectedFeatId(null);
    if (!selectedRace?.featOptions) { setChosenFeatSkills(new Set()); setChosenFeatTools(new Set());}
  }, [selectedRaceId, selectedRace]);

  useEffect(() => { setChosenClassSkills(new Set()); setChosenClassTools(new Set()); setChosenClassFeatureSelections({}); }, [selectedClassId]);
  useEffect(() => { setChosenBackgroundLanguages([]); setChosenBackgroundTools({}); }, [selectedBackgroundId]);
  useEffect(() => { setChosenFeatSkills(new Set()); setChosenFeatTools(new Set());}, [selectedFeatId]);

  // Recalculate final equipment list when class, background, or choices change
  useEffect(() => {
    const classEquipChoices = selectedClass?.startingEquipment.filter(e => typeof e === 'object') as EquipmentChoice[] || [];
    const classDirectGrants = selectedClass?.startingEquipment.filter(e => typeof e === 'string') as string[] || [];
    const bgEquipChoices = selectedBackground?.startingEquipment.filter(e => typeof e === 'object') as EquipmentChoice[] || [];
    const bgDirectGrants = selectedBackground?.startingEquipment.filter(e => typeof e === 'string') as string[] || [];

    const newFinalList: string[] = [...classDirectGrants, ...bgDirectGrants];
    const combinedChoices = [...classEquipChoices, ...bgEquipChoices];

    combinedChoices.forEach(choice => {
        const chosenOptionId = chosenStartingEquipment[choice.id];
        if (chosenOptionId) {
            const chosenOption = choice.from.find(opt => opt.id === chosenOptionId);
            if (chosenOption) {
                newFinalList.push(...chosenOption.itemsToGrant);
            }
        }
    });
    setFinalEquipmentList(Array.from(new Set(newFinalList))); // Remove duplicates
  }, [selectedClass, selectedBackground, chosenStartingEquipment]);

  // Reset equipment choices if class or background changes
  useEffect(() => {
    setChosenStartingEquipment({});
  }, [selectedClassId, selectedBackgroundId]);


  useEffect(() => {
    const newGlobalSkills = new Set<keyof SkillProficiencies>();
    const newGlobalTools = new Set<string>();
    const newGlobalLangs = new Set<string>();

    selectedRace?.skillProficiencies?.forEach(s => newGlobalSkills.add(s));
    selectedRace?.languages.forEach(l => { if (typeof l === 'string') newGlobalLangs.add(l); });

    selectedBackground?.skillProficiencies.forEach(s => newGlobalSkills.add(s));
    selectedBackground?.toolProficiencies?.forEach(t => { if (typeof t === 'string') newGlobalTools.add(t); });
    selectedBackground?.languages?.forEach(l => { if (typeof l === 'string') newGlobalLangs.add(l); });

    selectedFeat?.directSkillProficiencies?.forEach(s => newGlobalSkills.add(s));
    selectedFeat?.directToolProficiencies?.forEach(t => newGlobalTools.add(t));

    chosenRaceLanguages.forEach(l_id => l_id && newGlobalLangs.add(l_id));
    chosenRaceSkills.forEach(s => newGlobalSkills.add(s));

    chosenClassSkills.forEach(s => newGlobalSkills.add(s));
    chosenClassTools.forEach(t => newGlobalTools.add(t));

    Object.values(chosenBackgroundTools).forEach(t => t && newGlobalTools.add(t));
    chosenBackgroundLanguages.forEach(l_id => l_id && newGlobalLangs.add(l_id));

    chosenFeatSkills.forEach(s => newGlobalSkills.add(s));
    chosenFeatTools.forEach(t => newGlobalTools.add(t));

    setGloballySelectedSkills(newGlobalSkills);
    setGloballySelectedTools(newGlobalTools);
    setGloballySelectedLanguages(newGlobalLangs);

  }, [
    selectedRace, selectedClass, selectedBackground, selectedFeat,
    chosenRaceLanguages, chosenRaceSkills,
    chosenClassSkills, chosenClassTools,
    chosenBackgroundTools, chosenBackgroundLanguages,
    chosenFeatSkills, chosenFeatTools
  ]);

  const validateRaceTab = useCallback(() => {
    if (!selectedRace) return false;
    const langChoices = selectedRace.languages.filter(l => typeof l === 'object') as { choose: number; from?: string[] }[];
    if (langChoices.some((lc, idx) => chosenRaceLanguages.slice(idx * lc.choose, (idx + 1) * lc.choose).filter(Boolean).length < lc.choose)) return false;
    if (selectedRace.skillProficiencyOptions && chosenRaceSkills.size !== selectedRace.skillProficiencyOptions.choose) return false;
    if (selectedRace.featOptions && !selectedFeatId) return false;
    if (selectedRace.bonusAbilityScoreChoice && chosenVariantHumanASIs.filter(Boolean).length !== selectedRace.bonusAbilityScoreChoice.choose) return false;

    if (selectedFeat) {
        if (selectedFeat.skillProficiencyOptions && chosenFeatSkills.size !== selectedFeat.skillProficiencyOptions.choose) return false;
        if (selectedFeat.toolProficiencyOptions && chosenFeatTools.size !== selectedFeat.toolProficiencyOptions.choose) return false;
    }
    return true;
  }, [selectedRace, chosenRaceLanguages, chosenRaceSkills, selectedFeatId, chosenVariantHumanASIs, selectedFeat, chosenFeatSkills, chosenFeatTools]);

  const validateClassTab = useCallback(() => {
    if (!selectedClass) return false;
    if (selectedClass.skillProficienciesOptions && chosenClassSkills.size !== selectedClass.skillProficienciesOptions.choose) return false;
    if (selectedClass.toolProficienciesOptions && chosenClassTools.size !== selectedClass.toolProficienciesOptions.choose) return false;

    for (const feature of selectedClass.classFeatures) {
        if (typeof feature === 'object' && 'options' in feature && 'choose' in feature) {
            const choice = feature as ClassFeatureChoice;
            const selections = chosenClassFeatureSelections[choice.id] || [];
            if (selections.length !== choice.choose) return false;
        }
    }
    return true;
  }, [selectedClass, chosenClassSkills, chosenClassTools, chosenClassFeatureSelections]);

  const validateBackgroundTab = useCallback(() => {
    if (!selectedBackground) return false;
    const langChoices = selectedBackground.languages?.filter(l => typeof l === 'object') as { choose: number; from?: string[] }[] || [];
    if (langChoices.some((lc, idx) => chosenBackgroundLanguages.slice(idx * lc.choose, (idx + 1) * lc.choose).filter(Boolean).length < lc.choose)) return false;

    const toolChoiceObjects = selectedBackground.toolProficiencies?.filter(t => typeof t === 'object') as { choose: number; options: string[] }[] || [];
    let expectedToolChoices = 0;
    toolChoiceObjects.forEach(tc => expectedToolChoices += tc.choose);
    let actualToolChoicesMade = 0;
    Object.values(chosenBackgroundTools).forEach(val => { if (val) actualToolChoicesMade++; });
    if (actualToolChoicesMade < expectedToolChoices) return false;

    return true;
  }, [selectedBackground, chosenBackgroundLanguages, chosenBackgroundTools]);

  const validateAbilitiesTab = useCallback(() => {
    if (abilityScoreMethod === 'manual') {
      return DND_ABILITY_SCORES_LIST.every(score => manualAbilityScores[score] >= 3 && manualAbilityScores[score] <= 20);
    }
    if (abilityScoreMethod === 'standardArray') {
      return standardArrayPool.length === 0 && DND_ABILITY_SCORES_LIST.every(score => assignedStandardArrayScores[score] !== undefined);
    }
    if (abilityScoreMethod === 'roll4d6kh3') {
      return rolledScores !== null && rolledScoresPool.length === 0 && DND_ABILITY_SCORES_LIST.every(score => assignedRolledScores[score] !== undefined);
    }
    return false;
  }, [abilityScoreMethod, manualAbilityScores, standardArrayPool, assignedStandardArrayScores, rolledScores, rolledScoresPool, assignedRolledScores]);

  const validateInventoryTab = useCallback(() => {
    const classEquipChoices = selectedClass?.startingEquipment.filter(e => typeof e === 'object') as EquipmentChoice[] || [];
    const bgEquipChoices = selectedBackground?.startingEquipment.filter(e => typeof e === 'object') as EquipmentChoice[] || [];
    const allEquipChoices = [...classEquipChoices, ...bgEquipChoices];

    for (const choice of allEquipChoices) {
        if (!chosenStartingEquipment[choice.id]) {
            return false; // A choice hasn't been made
        }
    }
    return true;
  }, [selectedClass, selectedBackground, chosenStartingEquipment]);


  const validateDetailsTab = useCallback(() => {
    return characterName.trim() !== '';
  }, [characterName]);

  useEffect(() => setTabValidity(prev => ({ ...prev, race: validateRaceTab() })), [validateRaceTab]);
  useEffect(() => setTabValidity(prev => ({ ...prev, class: validateClassTab() })), [validateClassTab]);
  useEffect(() => setTabValidity(prev => ({ ...prev, background: validateBackgroundTab() })), [validateBackgroundTab]);
  useEffect(() => setTabValidity(prev => ({ ...prev, abilities: validateAbilitiesTab() })), [validateAbilitiesTab]);
  useEffect(() => setTabValidity(prev => ({ ...prev, inventory: validateInventoryTab() })), [validateInventoryTab]);
  useEffect(() => setTabValidity(prev => ({ ...prev, details: validateDetailsTab() })), [validateDetailsTab]);

  useEffect(() => { if(!selectedRaceId && DND_RACES_DETAILED.length > 0) setSelectedRaceId(DND_RACES_DETAILED[0].id);}, [selectedRaceId]);
  useEffect(() => { if(!selectedClassId && currentTab === 'class' && DND_CLASSES_DETAILED.length > 0) setSelectedClassId(DND_CLASSES_DETAILED[0].id);}, [selectedClassId, currentTab]);
  useEffect(() => { if(!selectedBackgroundId && currentTab === 'background' && DND_BACKGROUNDS_DETAILED.length > 0) setSelectedBackgroundId(DND_BACKGROUNDS_DETAILED[0].id);}, [selectedBackgroundId, currentTab]);


  const handleTabChange = (tabId: CharacterCreationTabName) => {
    setCurrentTab(tabId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(tabValidity).some(isValid => !isValid)) {
        alert("Please complete all required selections on all tabs.");
        const firstInvalidTab = TABS.find(tab => !tabValidity[tab.id]);
        if (firstInvalidTab) setCurrentTab(firstInvalidTab.id);
        return;
    }

    let baseScoresToUse: AbilityScores;
    if (abilityScoreMethod === 'manual') {
        baseScoresToUse = { ...manualAbilityScores };
    } else if (abilityScoreMethod === 'standardArray') {
        baseScoresToUse = { ...assignedStandardArrayScores } as AbilityScores;
    } else if (abilityScoreMethod === 'roll4d6kh3' && rolledScores) {
        baseScoresToUse = { ...assignedRolledScores } as AbilityScores;
    } else {
        alert("Error determining ability scores. Please check the Abilities tab.");
        setCurrentTab('abilities');
        return;
    }

    const finalAbilityScores: AbilityScores = { ...baseScoresToUse };
    if (selectedRace!.abilityScoreIncreases) {
        for (const [key, value] of Object.entries(selectedRace!.abilityScoreIncreases)) {
            finalAbilityScores[key as keyof AbilityScores] = (finalAbilityScores[key as keyof AbilityScores] || 0) + (value || 0);
        }
    }
    if (selectedRace!.bonusAbilityScoreChoice) {
      chosenVariantHumanASIs.forEach(asiKey => {
        finalAbilityScores[asiKey] = (finalAbilityScores[asiKey] || 0) + (selectedRace!.bonusAbilityScoreChoice?.amount || 0);
      });
    }
    if (selectedFeat?.abilityScoreIncrease) {
        for (const [key, value] of Object.entries(selectedFeat.abilityScoreIncrease)) {
            finalAbilityScores[key as keyof AbilityScores] = (finalAbilityScores[key as keyof AbilityScores] || 0) + (value || 0);
        }
    }

    const finalSkillProficienciesSet = new Set<keyof SkillProficiencies>();
    selectedRace!.skillProficiencies?.forEach(skill => finalSkillProficienciesSet.add(skill));
    selectedBackground!.skillProficiencies.forEach(skill => finalSkillProficienciesSet.add(skill));
    chosenRaceSkills.forEach(skill => finalSkillProficienciesSet.add(skill));
    chosenClassSkills.forEach(skill => finalSkillProficienciesSet.add(skill));
    chosenFeatSkills.forEach(skill => finalSkillProficienciesSet.add(skill));
    selectedFeat?.directSkillProficiencies?.forEach(skill => finalSkillProficienciesSet.add(skill));

    const finalSkillsObject: SkillProficiencies = {};
    DND_SKILLS_DEFINITIONS.forEach(sDef => {
        if (finalSkillProficienciesSet.has(sDef.id)) {
            finalSkillsObject[sDef.id] = true;
        }
    });

    const allLanguagesSet = new Set<string>();
    selectedRace!.languages.forEach(lang => typeof lang === 'string' && allLanguagesSet.add(lang));
    chosenRaceLanguages.forEach(lang_id => lang_id && allLanguagesSet.add(lang_id));
    selectedBackground!.languages?.forEach(lang => typeof lang === 'string' && allLanguagesSet.add(lang));
    chosenBackgroundLanguages.forEach(lang_id => lang_id && allLanguagesSet.add(lang_id));

    const allToolProficiencies = new Set<string>();
    selectedBackground!.toolProficiencies?.forEach(tool => typeof tool === 'string' && allToolProficiencies.add(tool));
    Object.values(chosenBackgroundTools).forEach(tool => tool && allToolProficiencies.add(tool));
    chosenClassTools.forEach(tool => allToolProficiencies.add(tool));
    chosenFeatTools.forEach(tool => allToolProficiencies.add(tool));
    selectedFeat?.directToolProficiencies?.forEach(tool => allToolProficiencies.add(tool));

    const hitDieSides = parseInt(selectedClass!.hitDie.substring(1), 10) || 8;
    const conModifier = getAbilityModifier(finalAbilityScores.constitution);
    let maxHp = hitDieSides + conModifier;
    if (selectedFeat?.id === 'feat_tough') maxHp += 2;

    const finalSenses = new Set<string>();
    if(selectedRace!.racialTraits.some(t => t.name.toLowerCase().includes("darkvision"))) finalSenses.add("Darkvision 60ft");
    if(selectedFeat?.id.startsWith('feat_observant')) finalSenses.add("Can read lips; +5 passive Perception/Investigation");


    const creationData: CharacterCreationData = {
        name: characterName.trim(),
        raceId: selectedRace!.id,
        classId: selectedClass!.id,
        backgroundId: selectedBackground!.id,
        level: 1,
        abilityScores: finalAbilityScores,
        skillProficiencies: finalSkillsObject,
        languages: Array.from(allLanguagesSet).join(','),
        weaponProficiencies: Array.from(new Set(selectedClass!.weaponProficiencies)).join(', '),
        armorProficiencies: Array.from(new Set(selectedClass!.armorProficiencies)).join(', '),
        toolProficiencies: Array.from(allToolProficiencies).join(', '),
        hitDie: selectedClass!.hitDie,
        maxHp: maxHp,
        armorClass: 10 + getAbilityModifier(finalAbilityScores.dexterity),
        speed: selectedRace!.speed,
        senses: Array.from(finalSenses).join(', '),
        chosenFeatId: selectedFeatId || undefined,
        chosenClassFeatures: chosenClassFeatureSelections,
        startingEquipment: finalEquipmentList,
    };

    onCreate(creationData);
    onClose();
  };

  const navigateTabs = (direction: 'next' | 'prev') => {
    const currentIndex = TABS.findIndex(t => t.id === currentTab);
    if (direction === 'next') {
        if (!tabValidity[currentTab]) {
            alert("Please complete all selections on this tab before proceeding.");
            return;
        }
        if (currentIndex < TABS.length - 1) handleTabChange(TABS[currentIndex + 1].id);
    } else if (direction === 'prev' && currentIndex > 0) {
        handleTabChange(TABS[currentIndex - 1].id);
    }
  };

  const handleSetSelectWithLimit = <T extends string>(
    currentSelections: Set<T>,
    setter: (value: React.SetStateAction<Set<T>>) => void,
    item: T,
    limit: number,
    globalSetToCheck?: Set<T>
  ) => {
    const isCurrentlySelectedByThisChoice = currentSelections.has(item);
    if (isCurrentlySelectedByThisChoice) {
      const newSelection = new Set(currentSelections);
      newSelection.delete(item);
      setter(newSelection);
    } else {
      if (globalSetToCheck && globalSetToCheck.has(item)) return;
      if (currentSelections.size < limit) {
        const newSelection = new Set(currentSelections);
        newSelection.add(item);
        setter(newSelection);
      } else if (limit === 1 && currentSelections.size === 1) {
        setter(new Set([item]));
      }
    }
  };

  const renderChoiceSelector = (
    options: readonly string[],
    selectedValue: string | undefined,
    onChange: (value: string) => void,
    label: string,
    idPrefix: string,
    isAbilityScore?: boolean,
    globalSetToCheck?: Set<string>,
    definitionList?: readonly LanguageDefinition[] | readonly FeatDetail[] | readonly EquipmentOption[]
  ) => (
    <select value={selectedValue || ""} onChange={(e) => { onChange(e.target.value); if (definitionList && definitionList[0] && 'typicalSpeakers' in definitionList[0]) showLanguagePreview(e.target.value); }} className={choiceSelectClass} aria-label={label}>
      <option value="" disabled>{label}</option>
      {options.map(optIdOrName => {
        let displayOptName = optIdOrName;
        if (definitionList) {
            const def = definitionList.find(d => d.id === optIdOrName);
            if (def) displayOptName = def.name;
        }
        const isDisabled = globalSetToCheck ? globalSetToCheck.has(optIdOrName) && optIdOrName !== selectedValue : false;
        return (
          <option key={`${idPrefix}-${optIdOrName}`} value={optIdOrName} disabled={isDisabled}>
            {isAbilityScore ? displayOptName.toUpperCase() : displayOptName.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
            {isDisabled ? " (Taken)" : ""}
          </option>
        );
      })}
    </select>
  );

  const renderCheckboxGroup = (
    options: readonly (keyof SkillProficiencies)[],
    selectedSet: Set<keyof SkillProficiencies>,
    onChange: (item: keyof SkillProficiencies) => void,
    limit: number,
    idPrefix: string,
    globalSetToCheck?: Set<keyof SkillProficiencies>
  ) => (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
      {options.map(optId => {
        const skillDef = DND_SKILLS_DEFINITIONS.find(s => s.id === optId);
        const displayOptName = skillDef ? skillDef.name : optId;
        const isSelectedByThisChoice = selectedSet.has(optId);
        const isDisabledByGlobal = globalSetToCheck ? globalSetToCheck.has(optId) && !isSelectedByThisChoice : false;
        const isFullyDisabled = isDisabledByGlobal || (!isSelectedByThisChoice && selectedSet.size >= limit);

        return (
          <label
            key={`${idPrefix}-${optId}`}
            className={`${choiceCheckboxLabelClass} ${isFullyDisabled && !isSelectedByThisChoice ? 'opacity-60 cursor-not-allowed' : ''}`}
            onMouseEnter={() => showSkillPreview(optId)}
            // NO onMouseLeave, preview is sticky
          >
            <input
              type="checkbox"
              className={choiceCheckboxClass}
              checked={isSelectedByThisChoice}
              onChange={() => onChange(optId)}
              disabled={isFullyDisabled}
            />
            {displayOptName}
            {isDisabledByGlobal ? <span className="text-xxs text-yellow-400 ml-1">(Taken)</span> : ""}
          </label>
        );
      })}
    </div>
  );

  const handleStandardArrayAssign = (ability: keyof AbilityScores, scoreToAssignStr: string | undefined) => {
    if (scoreToAssignStr === undefined) return;
    const scoreToAssign = parseInt(scoreToAssignStr, 10);

    setAssignedStandardArrayScores(prevAssigned => {
        const newAssigned = { ...prevAssigned };
        const oldScoreForThisAbility = newAssigned[ability];

        for (const key in newAssigned) {
            if (newAssigned[key as keyof AbilityScores] === scoreToAssign) {
                delete newAssigned[key as keyof AbilityScores];
            }
        }

        newAssigned[ability] = scoreToAssign;

        setStandardArrayPool(prevPool => {
            let newPool = [...prevPool];
            if (oldScoreForThisAbility !== undefined) {
                newPool.push(oldScoreForThisAbility);
            }
            newPool = newPool.filter(s => s !== scoreToAssign);
            newPool.sort((a,b) => b-a);
            return newPool;
        });
        return newAssigned;
    });
  };

  const handleRoll4d6kh3 = () => {
    if (rolledStatsLocked) return;
    const newRolledScores: number[] = [];
    for (let i = 0; i < 6; i++) {
        const rolls = [
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1,
        ];
        rolls.sort((a, b) => b - a);
        newRolledScores.push(rolls[0] + rolls[1] + rolls[2]);
    }
    newRolledScores.sort((a,b) => b-a);
    setRolledScores(newRolledScores);
    setRolledScoresPool([...newRolledScores]);
    setAssignedRolledScores({});
    setRolledStatsLocked(true);
    window.alert(`Stats Rolled: ${newRolledScores.join(', ')}\nThese are now locked in. Please assign them.`);
  };

  const handleRolledScoreAssign = (ability: keyof AbilityScores, scoreToAssignStr: string | undefined) => {
    if (!rolledScores || scoreToAssignStr === undefined) return;
    const scoreToAssign = parseInt(scoreToAssignStr, 10);

    setAssignedRolledScores(prevAssigned => {
        const newAssigned = { ...prevAssigned };
        const oldScoreForThisAbility = newAssigned[ability];

        for (const key in newAssigned) {
            if (newAssigned[key as keyof AbilityScores] === scoreToAssign) {
                delete newAssigned[key as keyof AbilityScores];
            }
        }
        newAssigned[ability] = scoreToAssign;

        setRolledScoresPool(prevPool => {
            let newPool = [...prevPool];
            if (oldScoreForThisAbility !== undefined) {
                newPool.push(oldScoreForThisAbility);
            }
            const indexToRemove = newPool.indexOf(scoreToAssign);
            if (indexToRemove > -1) {
                newPool.splice(indexToRemove, 1);
            }
            newPool.sort((a,b) => b-a);
            return newPool;
        });
        return newAssigned;
    });
  };

  useEffect(() => {
    if (abilityScoreMethod === 'standardArray') {
        setManualAbilityScores({ ...DEFAULT_ABILITY_SCORES, ...assignedStandardArrayScores } as AbilityScores);
    } else if (abilityScoreMethod === 'roll4d6kh3') {
        setManualAbilityScores({ ...DEFAULT_ABILITY_SCORES, ...assignedRolledScores } as AbilityScores);
    }
  }, [abilityScoreMethod, assignedStandardArrayScores, assignedRolledScores]);


  const getFinalAbilityScoresForDisplay = useCallback((): AbilityScores => {
    let baseScoresToUse: AbilityScores;
    if (abilityScoreMethod === 'manual') {
        baseScoresToUse = { ...manualAbilityScores };
    } else if (abilityScoreMethod === 'standardArray') {
        baseScoresToUse = { ...DEFAULT_ABILITY_SCORES, ...assignedStandardArrayScores } as AbilityScores;
    } else if (abilityScoreMethod === 'roll4d6kh3' && rolledStatsLocked && Object.keys(assignedRolledScores).length === DND_ABILITY_SCORES_LIST.length) {
        baseScoresToUse = { ...DEFAULT_ABILITY_SCORES, ...assignedRolledScores } as AbilityScores;
    } else {
        baseScoresToUse = { ...DEFAULT_ABILITY_SCORES };
    }

    const finalScores: AbilityScores = { ...baseScoresToUse };
    if (selectedRace?.abilityScoreIncreases) {
        for (const [key, value] of Object.entries(selectedRace.abilityScoreIncreases)) {
            finalScores[key as keyof AbilityScores] = (finalScores[key as keyof AbilityScores] || 0) + (value || 0);
        }
    }
    if (selectedRace?.bonusAbilityScoreChoice && chosenVariantHumanASIs.length === selectedRace.bonusAbilityScoreChoice.choose) {
      chosenVariantHumanASIs.forEach(asiKey => {
        finalScores[asiKey] = (finalScores[asiKey] || 0) + (selectedRace.bonusAbilityScoreChoice!.amount || 0);
      });
    }
    if (selectedFeat?.abilityScoreIncrease) {
        for (const [key, value] of Object.entries(selectedFeat.abilityScoreIncrease)) {
            finalScores[key as keyof AbilityScores] = (finalScores[key as keyof AbilityScores] || 0) + (value || 0);
        }
    }
    return finalScores;
  }, [abilityScoreMethod, manualAbilityScores, assignedStandardArrayScores, assignedRolledScores, selectedRace, chosenVariantHumanASIs, selectedFeat, rolledStatsLocked]);
  const finalDisplayScores = useMemo(getFinalAbilityScoresForDisplay, [getFinalAbilityScoresForDisplay]);


  const renderRightPanelContent = () => {
    let title = "Details";
    let flavor = "Select an option on the left to see more details.";
    let effects: React.ReactNode[] = [];
    let choiceElements: React.ReactNode[] = [];
    let detailPreviewElement: React.ReactNode = null;

    if (currentTab === 'race' && selectedRace) {
      title = selectedRace.name; flavor = selectedRace.flavorText;
      effects.push(<p key="asi_direct"><strong>Ability Scores:</strong> {Object.entries(selectedRace.abilityScoreIncreases).map(([key, val]) => `+${val} ${key.slice(0,3).toUpperCase()}`).join(', ')}</p>);
      effects.push(<p key="speed"><strong>Speed:</strong> {selectedRace.speed} ft.</p>);
      effects.push(<p key="size"><strong>Size:</strong> {selectedRace.size}</p>);
      const staticLangIds = selectedRace.languages.filter(l => typeof l === 'string') as string[];
      if (staticLangIds.length > 0) {
        const langNames = staticLangIds.map(id => DND_LANGUAGES_DEFINITIONS.find(def => def.id === id)?.name || id).join(', ');
        effects.push(<p key="lang_static"><strong>Languages:</strong> {langNames}</p>);
      }
      selectedRace.skillProficiencies?.forEach(skillId => effects.push(<p key={`skill_direct_${skillId}`}><strong>Skill Prof:</strong> {DND_SKILLS_DEFINITIONS.find(s=>s.id === skillId)?.name || skillId}</p>));
      if (selectedRace.racialTraits.length > 0) effects.push(<div key="traits"><strong>Traits:</strong> <ul className="list-disc list-inside ml-2">{selectedRace.racialTraits.map(t => <li key={t.id}><strong>{t.name}:</strong> {t.description}</li>)}</ul></div>);

      let langChoiceCounter = 0;
      selectedRace.languages.forEach((langOption, index) => {
        if (typeof langOption === 'object' && langOption.choose) {
          for (let i = 0; i < langOption.choose; i++) {
            const currentChoiceIndex = langChoiceCounter + i;
            choiceElements.push(
              <div key={`race-lang-choice-${index}-${i}`} className={choiceSectionClass}>
                <label className={choiceLabelClass}>Choose Language #{i + 1}</label>
                {renderChoiceSelector( langOption.from || DND_LANGUAGES_OPTION_LIST.filter(l_id => !staticLangIds.includes(l_id)), chosenRaceLanguages[currentChoiceIndex], (val) => { const newLangs = [...chosenRaceLanguages]; newLangs[currentChoiceIndex] = val; setChosenRaceLanguages(newLangs); showLanguagePreview(val); }, `Choose Language ${i+1}`, `race-lang-${index}-${i}`, false, globallySelectedLanguages, DND_LANGUAGES_DEFINITIONS)}
              </div>);
          } langChoiceCounter += langOption.choose;
        }});
      if (selectedRace.bonusAbilityScoreChoice) {
          const {choose, amount, options: asiOptions } = selectedRace.bonusAbilityScoreChoice;
          choiceElements.push(
            <div key="race-asi-choice" className={choiceSectionClass}>
              <label className={choiceLabelClass}>Choose {choose} Ability Score(s) to Increase by +{amount}:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[...Array(choose)].map((_, idx) => (
                  <div key={`asi-choice-${idx}`}>
                    {renderChoiceSelector(
                      asiOptions || DND_ABILITY_SCORES_LIST,
                      chosenVariantHumanASIs[idx],
                      (val) => {
                        const newASIs = [...chosenVariantHumanASIs];
                        newASIs[idx] = val as keyof AbilityScores;
                        setChosenVariantHumanASIs(newASIs);
                      },
                      `ASI Choice ${idx+1}`, `race-asi-${idx}`, true,
                      new Set(chosenVariantHumanASIs.filter((v, i) => i !== idx))
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
      }
      if (selectedRace.skillProficiencyOptions) { const { choose, options } = selectedRace.skillProficiencyOptions; choiceElements.push(<div key="race-skill-choice" className={choiceSectionClass}><label className={choiceLabelClass}>Choose {choose} Skill Proficiencies:</label>{renderCheckboxGroup(options, chosenRaceSkills, (item) => handleSetSelectWithLimit(chosenRaceSkills, setChosenRaceSkills, item, choose, globallySelectedSkills), choose, 'race-skill', globallySelectedSkills)}</div>); }
      if (selectedRace.featOptions) {
          choiceElements.push(
            <div key="race-feat-choice" className={choiceSectionClass}>
              <label className={choiceLabelClass}>Choose 1 Feat:</label>
              {renderChoiceSelector(DND_FEATS_DETAILED.map(f => f.id), selectedFeatId || undefined, (val) => setSelectedFeatId(val), 'Choose Feat', 'race-feat', false, undefined, DND_FEATS_DETAILED)}
            </div>
          );
      }
    } else if (currentTab === 'class' && selectedClass) {
        title = selectedClass.name; flavor = selectedClass.flavorText;
        effects.push(<p key="hd"><strong>Hit Die:</strong> {selectedClass.hitDie}</p>);
        effects.push(<p key="pa"><strong>Primary Abilities:</strong> {selectedClass.primaryAbilities.map(s => s.slice(0,3).toUpperCase()).join(', ')}</p>);
        effects.push(<p key="sp"><strong>Saving Throws:</strong> {selectedClass.savingThrowProficiencies.map(s => s.slice(0,3).toUpperCase()).join(', ')}</p>);
        effects.push(<p key="ap"><strong>Armor Profs:</strong> {selectedClass.armorProficiencies.join(', ') || 'None'}</p>);
        effects.push(<p key="wp"><strong>Weapon Profs:</strong> {selectedClass.weaponProficiencies.join(', ')}</p>);

        if (selectedClass.classFeatures.length > 0) {
            effects.push(<div key="cf_header"><strong>Features (Lvl 1):</strong></div>);
            selectedClass.classFeatures.forEach(feature => {
                if ('options' in feature) {
                    const choiceFeature = feature as ClassFeatureChoice;
                    effects.push(<p key={choiceFeature.id} className="ml-2"><strong>{choiceFeature.name}:</strong> {choiceFeature.description}</p>);

                    choiceElements.push(
                      <div key={`${choiceFeature.id}-choices`} className={choiceSectionClass}>
                        <label className={choiceLabelClass}>Choose {choiceFeature.choose} {choiceFeature.name} Option(s):</label>
                        <div className="grid grid-cols-1 gap-1">
                          {choiceFeature.options.map(opt => {
                            const isSelected = (chosenClassFeatureSelections[choiceFeature.id] || []).includes(opt.name);
                            return (
                              <button
                                type="button"
                                key={opt.id}
                                onClick={() => {
                                  const currentSelections = new Set(chosenClassFeatureSelections[choiceFeature.id] || []);
                                  handleSetSelectWithLimit(currentSelections, (newSet: Set<string>) => {
                                    setChosenClassFeatureSelections(prev => ({...prev, [choiceFeature.id]: [...newSet]}));
                                  }, opt.name, choiceFeature.choose);
                                }}
                                onMouseEnter={() => showClassFeatureOptionPreview(opt)}
                                // NO onMouseLeave, preview is sticky
                                className={`p-1.5 text-xs text-left rounded-md transition-colors ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                              >
                                {opt.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                } else {
                    const directFeature = feature as Pick<ActionDetail, 'id' | 'name' | 'description' | 'source'>;
                    effects.push(<p key={directFeature.id} className="ml-2"><strong>{directFeature.name}:</strong> {directFeature.description}</p>);
                }
            });
        }
        if(selectedClass.recommendedBackgrounds && selectedClass.recommendedBackgrounds.length > 0) effects.push(<p key="rbg" className="mt-2 text-xs text-gray-400"><i>Recommended Backgrounds: {selectedClass.recommendedBackgrounds.map(bgId => DND_BACKGROUNDS_DETAILED.find(bg=>bg.id === bgId)?.name || bgId).join(', ')}</i></p>);
        if (selectedClass.skillProficienciesOptions) { const { choose, options } = selectedClass.skillProficienciesOptions; choiceElements.push(<div key="class-skill-choice" className={choiceSectionClass}><label className={choiceLabelClass}>Choose {choose} Skill Proficiencies:</label>{renderCheckboxGroup(options, chosenClassSkills, (item) => handleSetSelectWithLimit(chosenClassSkills, setChosenClassSkills, item, choose, globallySelectedSkills), choose, 'class-skill', globallySelectedSkills)}</div>); }
        if (selectedClass.toolProficienciesOptions) {
             const { choose, options } = selectedClass.toolProficienciesOptions;
             choiceElements.push(
                <div key="class-tool-choice" className={choiceSectionClass}>
                    <label className={choiceLabelClass}>Choose {choose} Tool Proficiencies:</label>
                    {renderCheckboxGroup(options as any, chosenClassTools as any, (item) => handleSetSelectWithLimit(chosenClassTools, setChosenClassTools, item as any, choose, globallySelectedTools), choose, 'class-tool', globallySelectedTools as any)}
                </div>
             );
        }
    } else if (currentTab === 'background' && selectedBackground) {
        title = selectedBackground.name; flavor = selectedBackground.flavorText;
        selectedBackground.skillProficiencies.forEach(skillId => effects.push(<p key={`bg_skill_${skillId}`}><strong>Skill Prof:</strong> {DND_SKILLS_DEFINITIONS.find(s=>s.id === skillId)?.name || skillId}</p>));
        const staticBgTools = selectedBackground.toolProficiencies?.filter(t => typeof t === 'string') as string[] || [];
        if (staticBgTools.length > 0) effects.push(<p key="bg_tool_static"><strong>Tool Profs:</strong> {staticBgTools.join(', ')}</p>);
        const staticBgLangIds = selectedBackground.languages?.filter(l => typeof l === 'string') as string[] || [];
        if (staticBgLangIds.length > 0) {
          const langNames = staticBgLangIds.map(id => DND_LANGUAGES_DEFINITIONS.find(def => def.id === id)?.name || id).join(', ');
          effects.push(<p key="bg_lang_static"><strong>Languages:</strong> {langNames}</p>);
        }
        effects.push(<div key="feat_bg"><strong>Feature - {selectedBackground.feature.name}:</strong> {selectedBackground.feature.description}</div>);

        let bgToolChoiceCounter = 0;
        selectedBackground.toolProficiencies?.forEach((toolOption, index) => { if (typeof toolOption === 'object' && toolOption.choose) { for (let i = 0; i < toolOption.choose; i++) {
            const currentChoiceIndex = bgToolChoiceCounter + i;
            choiceElements.push(<div key={`bg-tool-choice-${index}-${i}`} className={choiceSectionClass}><label className={choiceLabelClass}>Choose Tool #{i + 1}</label>{renderChoiceSelector( toolOption.options, chosenBackgroundTools[currentChoiceIndex], (val) => { const newTools = {...chosenBackgroundTools}; newTools[currentChoiceIndex] = val; setChosenBackgroundTools(newTools); }, `Choose Tool ${i+1}`, `bg-tool-${index}-${i}`, false, globallySelectedTools)}</div>);
        } bgToolChoiceCounter += toolOption.choose; }});

        let bgLangChoiceCounter = 0;
        selectedBackground.languages?.forEach((langOption, index) => { if (typeof langOption === 'object' && langOption.choose) { for (let i = 0; i < langOption.choose; i++) {
            const currentChoiceIndex = bgLangChoiceCounter + i;
            choiceElements.push(<div key={`bg-lang-choice-${index}-${i}`} className={choiceSectionClass}><label className={choiceLabelClass}>Choose Language #{i + 1}</label>{renderChoiceSelector( langOption.from || DND_LANGUAGES_OPTION_LIST.filter(l_id => !staticBgLangIds.includes(l_id)), chosenBackgroundLanguages[currentChoiceIndex], (val) => { const newLangs = [...chosenBackgroundLanguages]; newLangs[currentChoiceIndex] = val; setChosenBackgroundLanguages(newLangs); showLanguagePreview(val); }, `Choose Language ${i+1}`, `bg-lang-${index}-${i}`, false, globallySelectedLanguages, DND_LANGUAGES_DEFINITIONS)}</div>);
        } bgLangChoiceCounter += langOption.choose; }});
    } else if (currentTab === 'abilities') {
        title = "Ability Scores";
        flavor = `Assign your ability scores using the ${abilityScoreMethod.replace(/([A-Z])/g, ' $1').toLowerCase()} method. Racial and feat bonuses will be applied to these base scores.`;
        DND_ABILITY_SCORES_LIST.forEach(score => {
          effects.push(<p key={`final_score_${score}`} className="capitalize"><strong>{score}:</strong> {finalDisplayScores[score]} (Modifier: {getAbilityModifier(finalDisplayScores[score]) >=0 ? '+':''}{getAbilityModifier(finalDisplayScores[score])})</p>);
        });
        if (abilityScoreMethod === 'standardArray') {
            choiceElements.push(
                <div key="sa-assignment" className={choiceSectionClass}>
                    <label className={choiceLabelClass}>Assign Standard Array Scores ({standardArrayPool.join(', ')})</label>
                    <div className="grid grid-cols-2 gap-2">
                        {DND_ABILITY_SCORES_LIST.map(abi => (
                            <div key={`sa-${abi}`} className="flex items-center">
                                <label className="text-xs capitalize mr-2 w-20">{abi}:</label>
                                <select value={assignedStandardArrayScores[abi] || ""} onChange={(e) => handleStandardArrayAssign(abi, e.target.value)} className={choiceSelectClass}>
                                    <option value="" disabled>Select</option>
                                    {(assignedStandardArrayScores[abi] !== undefined ? [assignedStandardArrayScores[abi]!, ...standardArrayPool] : standardArrayPool).filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>b-a).map(sVal => <option key={`sa-opt-${sVal}`} value={sVal}>{sVal}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            );
        } else if (abilityScoreMethod === 'roll4d6kh3') {
            if (rolledScores) {
                choiceElements.push(
                    <div key="roll-assignment" className={choiceSectionClass}>
                        <label className={choiceLabelClass}>Assign Rolled Scores ({rolledScoresPool.join(', ')})</label>
                        <div className="grid grid-cols-2 gap-2">
                            {DND_ABILITY_SCORES_LIST.map(abi => (
                                <div key={`roll-${abi}`} className="flex items-center">
                                <label className="text-xs capitalize mr-2 w-20">{abi}:</label>
                                <select value={assignedRolledScores[abi] || ""} onChange={(e) => handleRolledScoreAssign(abi, e.target.value)} className={choiceSelectClass} disabled={!rolledStatsLocked}>
                                    <option value="" disabled>Select</option>
                                    {(assignedRolledScores[abi] !== undefined ? [assignedRolledScores[abi]!, ...rolledScoresPool] : rolledScoresPool).filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>b-a).map(sVal => <option key={`roll-opt-${sVal}`} value={sVal}>{sVal}</option>)}
                                </select>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }
        }
    } else if (currentTab === 'inventory') {
        title = "Starting Inventory";
        flavor = "Review your automatically granted items and make choices for equipment from your class and background.";

        const classEquipChoices = selectedClass?.startingEquipment.filter(e => typeof e === 'object') as EquipmentChoice[] || [];
        const classDirectGrants = selectedClass?.startingEquipment.filter(e => typeof e === 'string') as string[] || [];
        const bgEquipChoices = selectedBackground?.startingEquipment.filter(e => typeof e === 'object') as EquipmentChoice[] || [];
        const bgDirectGrants = selectedBackground?.startingEquipment.filter(e => typeof e === 'string') as string[] || [];

        const allDirectGrants = [...classDirectGrants, ...bgDirectGrants];
        const allEquipChoices = [...classEquipChoices, ...bgEquipChoices];

        if(allDirectGrants.length > 0) {
            effects.push(<div key="direct_equip_header"><strong>Automatic Equipment:</strong></div>);
            allDirectGrants.forEach((item, idx) => effects.push(<p key={`direct_item_${idx}`} className="ml-2">{item}</p>));
        }

        allEquipChoices.forEach((choice, idx) => {
            choiceElements.push(
                <div key={choice.id || `equip_choice_${idx}`} className={choiceSectionClass}>
                    <label className={choiceLabelClass}>{choice.description || `Choose ${choice.choose} option(s):`}</label>
                    {choice.from.map(option => (
                        <label key={option.id} className={`${radioLabelClass} mb-0.5`}>
                            <input
                                type="radio"
                                name={choice.id || `equip_choice_radio_${idx}`}
                                value={option.id}
                                checked={chosenStartingEquipment[choice.id || `equip_choice_${idx}`] === option.id}
                                onChange={() => setChosenStartingEquipment(prev => ({...prev, [choice.id || `equip_choice_${idx}`]: option.id}))}
                                className={radioInputClass}
                            />
                            <span className="ml-2 text-xs">{option.name}</span>
                        </label>
                    ))}
                </div>
            );
        });

        if (finalEquipmentList.length > 0) {
             effects.push(<div key="final_equip_header" className="mt-3 pt-2 border-t border-gray-600"><strong>Final Equipment List:</strong></div>);
             finalEquipmentList.forEach((item, idx) => effects.push(<p key={`final_item_${idx}`} className="ml-2 text-gray-300">{item}</p>));
        }


    } else if (currentTab === 'details') {
        title = "Final Review";
        flavor = "Review your choices and give your character a name!";
        if (selectedRace) effects.push(<p key="det_race"><strong>Race:</strong> {selectedRace.name}</p>);
        if (selectedClass) effects.push(<p key="det_class"><strong>Class:</strong> {selectedClass.name}</p>);
        if (selectedBackground) effects.push(<p key="det_bg"><strong>Background:</strong> {selectedBackground.name}</p>);
        if (selectedFeat) effects.push(<p key="det_feat"><strong>Feat:</strong> {selectedFeat.name}</p>);

        const finalLangsArray = Array.from(globallySelectedLanguages).map(id => DND_LANGUAGES_DEFINITIONS.find(def => def.id === id)?.name || id);
        if (finalLangsArray.length > 0) effects.push(<p key="det_langs"><strong>Languages:</strong> {finalLangsArray.join(', ')}</p>);

        const finalSkillsArray = Array.from(globallySelectedSkills).map(id => DND_SKILLS_DEFINITIONS.find(def => def.id === id)?.name || id);
        if (finalSkillsArray.length > 0) effects.push(<p key="det_skills"><strong>Skills:</strong> {finalSkillsArray.join(', ')}</p>);

        const finalToolsArray = Array.from(globallySelectedTools);
        if (finalToolsArray.length > 0) effects.push(<p key="det_tools"><strong>Tools:</strong> {finalToolsArray.join(', ')}</p>);

        const allChosenClassFeatureOptions = Object.entries(chosenClassFeatureSelections).map(([featChoiceName, opts]) => `${featChoiceName}: ${opts.join(', ')}`);
        if(allChosenClassFeatureOptions.length > 0) effects.push(<p key="det_classfeats"><strong>Class Feature Choices:</strong> {allChosenClassFeatureOptions.join('; ')}</p>);

        effects.push(<div key="det_scores" className="mt-2"><strong>Ability Scores (Final):</strong><ul className="list-disc list-inside ml-2 text-xs">{DND_ABILITY_SCORES_LIST.map(score => <li key={`final_ab_${score}`} className="capitalize">{score}: {finalDisplayScores[score]} ({getAbilityModifier(finalDisplayScores[score]) >=0 ? '+':''}{getAbilityModifier(finalDisplayScores[score])})</li>)}</ul></div>);

        if (finalEquipmentList.length > 0) {
             effects.push(<div key="det_equip_final" className="mt-2"><strong>Equipment:</strong><ul className="list-disc list-inside ml-2 text-xs">{finalEquipmentList.map((item, idx) => <li key={`equip_final_${idx}`}>{item}</li>)}</ul></div>);
        }
    }

    if (selectedFeat && (currentTab === 'race' || currentTab === 'details')) {
        if(selectedFeat.skillProficiencyOptions) {
            const { choose, options } = selectedFeat.skillProficiencyOptions;
            choiceElements.push(<div key="feat-skill-choice" className={choiceSectionClass}><label className={choiceLabelClass}>Feat Skill Choices ({selectedFeat.name}) - Choose {choose}:</label>{renderCheckboxGroup(options, chosenFeatSkills, (item) => handleSetSelectWithLimit(chosenFeatSkills, setChosenFeatSkills, item, choose, globallySelectedSkills), choose, 'feat-skill', globallySelectedSkills)}</div>);
        }
        if(selectedFeat.toolProficiencyOptions) {
            const { choose, options } = selectedFeat.toolProficiencyOptions;
             choiceElements.push(
                <div key="feat-tool-choice" className={choiceSectionClass}>
                    <label className={choiceLabelClass}>Feat Tool Choices ({selectedFeat.name}) - Choose {choose}:</label>
                    {renderCheckboxGroup(options as any, chosenFeatTools as any, (item) => handleSetSelectWithLimit(chosenFeatTools, setChosenFeatTools, item as any, choose, globallySelectedTools), choose, 'feat-tool', globallySelectedTools as any)}
                </div>
             );
        }
    }

    if (previewedClassFeatureOption) {
        detailPreviewElement = (
            <div className={detailPreviewBoxClass}>
                <h4 className="font-semibold text-indigo-300 mb-0.5">{previewedClassFeatureOption.name}</h4>
                <p className="text-gray-300 whitespace-pre-line">{previewedClassFeatureOption.description}</p>
                {previewedClassFeatureOption.source && <p className="mt-1 text-gray-400 text-xxs">Source: {previewedClassFeatureOption.source}</p>}
            </div>
        );
    } else if (previewedSkillId) {
        const skillDef = DND_SKILLS_DEFINITIONS.find(s => s.id === previewedSkillId);
        if (skillDef) {
            detailPreviewElement = (
                <div className={detailPreviewBoxClass}>
                    <h4 className="font-semibold text-indigo-300 mb-0.5">{skillDef.name} ({skillDef.ability.slice(0,3).toUpperCase()})</h4>
                    <p className="text-gray-300 whitespace-pre-line">{skillDef.description}</p>
                </div>
            );
        }
    } else if (previewedLanguageId) {
        const langDef = DND_LANGUAGES_DEFINITIONS.find(l => l.id === previewedLanguageId);
        if (langDef) {
            detailPreviewElement = (
                <div className={detailPreviewBoxClass}>
                    <h4 className="font-semibold text-indigo-300 mb-0.5">{langDef.name}</h4>
                    <p className="text-gray-300 whitespace-pre-line">{langDef.description}</p>
                    {langDef.typicalSpeakers && <p className="mt-1 text-gray-400">Typical Speakers: {langDef.typicalSpeakers}</p>}
                </div>
            );
        }
    } else if (currentTab === 'race' && chosenRaceLanguages.filter(Boolean).length > 0 && selectedRace?.languages.some(l => typeof l === 'object' && (l.from ? l.from.length > 1 : DND_LANGUAGES_OPTION_LIST.length > 1) && (l as {choose:number}).choose > 0 )) {
        const selectedLangDefs = chosenRaceLanguages.map(id => DND_LANGUAGES_DEFINITIONS.find(def => def.id === id)).filter(Boolean) as LanguageDefinition[];
        if (selectedLangDefs.length > 0) {
            detailPreviewElement = (
                <div className={`${detailPreviewBoxClass} space-y-1.5`}>
                    <h4 className="font-semibold text-indigo-300 mb-0.5">Selected Race Languages:</h4>
                    {selectedLangDefs.map(langDef => (
                        <div key={`preview-race-${langDef.id}`}>
                             <p className="text-gray-300 font-medium">{langDef.name}</p>
                             <p className="text-gray-400 text-xxs whitespace-pre-line">{langDef.description}</p>
                        </div>
                    ))}
                </div>
            );
        }
    } else if (currentTab === 'background' && chosenBackgroundLanguages.filter(Boolean).length > 0 && selectedBackground?.languages?.some(l => typeof l === 'object' && (l.from ? l.from.length > 1 : DND_LANGUAGES_OPTION_LIST.length > 1) && (l as {choose:number}).choose > 0 )) {
        const selectedLangDefs = chosenBackgroundLanguages.map(id => DND_LANGUAGES_DEFINITIONS.find(def => def.id === id)).filter(Boolean) as LanguageDefinition[];
        if (selectedLangDefs.length > 0) {
            detailPreviewElement = (
                <div className={`${detailPreviewBoxClass} space-y-1.5`}>
                    <h4 className="font-semibold text-indigo-300 mb-0.5">Selected Background Languages:</h4>
                    {selectedLangDefs.map(langDef => (
                        <div key={`preview-bg-${langDef.id}`}>
                             <p className="text-gray-300 font-medium">{langDef.name}</p>
                             <p className="text-gray-400 text-xxs whitespace-pre-line">{langDef.description}</p>
                        </div>
                    ))}
                </div>
            );
        }
    }


    return (
        <div className="p-4 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
            <h3 className={sectionTitleClass}>{title}</h3>
            <p className={flavorTextClass}>{flavor}</p>
            <div className={`${mechanicalEffectClass} space-y-1.5 mb-3`}>{effects}</div>
            {choiceElements.length > 0 && <div className="space-y-2">{choiceElements}</div>}
            {detailPreviewElement}
        </div>);
  };


  if (!isOpen) return null;
  const isNextDisabled = !tabValidity[currentTab];
  const isCreateDisabled = Object.values(tabValidity).some(isValid => !isValid);

  return (
    <div className="fixed inset-0 z-[70] bg-black bg-opacity-80 flex items-center justify-center p-2 sm:p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col text-gray-100">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-2xl font-semibold text-indigo-400">Create New Character</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>

        <div className="flex border-b border-gray-700">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)}
              className={`${tabButtonClass} ${currentTab === tab.id ? activeTabButtonClass : inactiveTabButtonClass}`}
            >
              <span className={`w-2 h-2 rounded-full mr-2 ${tabValidity[tab.id] ? 'bg-green-500' : 'bg-red-500'}`} title={tabValidity[tab.id] ? 'Complete' : 'Incomplete'}></span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-grow overflow-hidden">
          <div className="w-1/3 border-r border-gray-700 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-750 p-3">
            {currentTab === 'race' && (<ul className="space-y-1.5">{DND_RACES_DETAILED.map(race => (<li key={race.id} onClick={() => {setSelectedRaceId(race.id);}} className={`${listItemClass} ${selectedRaceId === race.id ? activeListItemClass : 'bg-gray-700'}`}>{race.name}</li>))}</ul>)}
            {currentTab === 'class' && (<ul className="space-y-1.5">{DND_CLASSES_DETAILED.map(klass => (<li key={klass.id} onClick={() => {setSelectedClassId(klass.id);}} className={`${listItemClass} ${selectedClassId === klass.id ? activeListItemClass : 'bg-gray-700'}`}>{klass.name}</li>))}</ul>)}
            {currentTab === 'background' && (<ul className="space-y-1.5">{DND_BACKGROUNDS_DETAILED.map(bg => (<li key={bg.id} onClick={() => {setSelectedBackgroundId(bg.id);}} className={`${listItemClass} ${selectedBackgroundId === bg.id ? activeListItemClass : 'bg-gray-700'} ${selectedClass?.recommendedBackgrounds?.includes(bg.id) ? 'border-l-2 border-yellow-400 pl-1.5' : ''}`}>{bg.name} {selectedClass?.recommendedBackgrounds?.includes(bg.id) && <span className="text-xxs text-yellow-300 ml-1">(Rec)</span>}</li>))}</ul>)}
            {currentTab === 'abilities' && (
              <div className="space-y-3">
                <h4 className="text-md font-semibold text-gray-300 mb-2">Generation Method:</h4>
                {(['standardArray', 'roll4d6kh3', 'manual'] as AbilityScoreGenerationMethod[]).map(method => (
                    <label key={method} className={`${radioLabelClass} mb-1.5 ${abilityScoreMethod === 'roll4d6kh3' && rolledStatsLocked && method !== 'roll4d6kh3' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <input
                            type="radio" name="abilityScoreMethod" value={method}
                            checked={abilityScoreMethod === method}
                            onChange={() => {
                                if (abilityScoreMethod === 'roll4d6kh3' && rolledStatsLocked && method !== 'roll4d6kh3') return;
                                setAbilityScoreMethod(method);
                                setManualAbilityScores({...DEFAULT_ABILITY_SCORES});
                                setAssignedStandardArrayScores({}); setStandardArrayPool([...DND_STANDARD_ARRAY]);
                                setRolledScores(null); setAssignedRolledScores({}); setRolledScoresPool([]);
                                if (method !== 'roll4d6kh3') { setRolledStatsLocked(false); }
                            }}
                            disabled={abilityScoreMethod === 'roll4d6kh3' && rolledStatsLocked && method !== 'roll4d6kh3'}
                            className={radioInputClass}
                        />
                        <span className="ml-2">{method === 'roll4d6kh3' ? "Roll" : method.replace(/([A-Z])/g, ' $1').replace(/^./, (str:string) => str.toUpperCase())}</span>
                    </label>
                ))}
                {abilityScoreMethod === 'manual' && DND_ABILITY_SCORES_LIST.map(scoreName => (
                  <div key={scoreName} className="flex items-center justify-between mt-2">
                    <label htmlFor={`ability-${scoreName}`} className="capitalize text-sm text-gray-300">{scoreName}:</label>
                    <input type="number" id={`ability-${scoreName}`} value={manualAbilityScores[scoreName]} onChange={(e) => setManualAbilityScores(prev => ({...prev, [scoreName]: parseInt(e.target.value) || 3 }))} className="w-20 p-1 bg-gray-700 border border-gray-600 rounded-md text-xs text-center" min="3" max="20"/>
                  </div>
                ))}
                 {abilityScoreMethod === 'roll4d6kh3' && (
                    <button
                        onClick={handleRoll4d6kh3}
                        disabled={rolledStatsLocked}
                        className="w-full mt-2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold rounded-md text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Roll Stats
                    </button>
                )}
              </div>
            )}
             {currentTab === 'inventory' && (
                <div>
                    <p className="text-xs text-gray-400 italic">Select choices for starting equipment. Final list will be shown in the right panel.</p>
                    {(!selectedClass && !selectedBackground) && <p className="text-xs text-gray-400 mt-2">Select a Class and Background first to see equipment options.</p>}
                </div>
             )}
            {currentTab === 'details' && (
              <div className="space-y-3">
                <h4 className="text-md font-semibold text-gray-300">Final Details</h4>
                <div><label htmlFor="charNameFinal" className="block text-sm font-medium text-gray-300 mb-1">Character Name*</label><input type="text" id="charNameFinal" value={characterName} onChange={(e) => setCharacterName(e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-xs" required /></div>
              </div>
            )}
          </div>

          <div className="w-2/3 bg-gray-750 overflow-hidden">
            {renderRightPanelContent()}
          </div>
        </div>

        <div className="flex justify-between items-center p-3 border-t border-gray-700">
          <button onClick={() => navigateTabs('prev')} disabled={TABS.findIndex(t => t.id === currentTab) === 0} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-md transition-colors text-sm disabled:opacity-50">Previous</button>
          {currentTab === TABS[TABS.length - 1].id ? (
            <button onClick={handleSubmit} disabled={isCreateDisabled} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors text-sm disabled:opacity-50 disabled:bg-gray-500">Create Character</button>
          ) : (
            <button onClick={() => navigateTabs('next')} disabled={isNextDisabled || TABS.findIndex(t => t.id === currentTab) === TABS.length - 1} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition-colors text-sm disabled:opacity-50 disabled:bg-gray-500">Next</button>
          )}
        </div>
      </div>
    </div>
  );
};