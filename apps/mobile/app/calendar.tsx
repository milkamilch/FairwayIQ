import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ExpoCalendar from 'expo-calendar';
import { useTheme } from '../src/lib/theme';
import { api } from '../src/lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoWeek(d: Date): number {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const w1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - w1.getTime()) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  const day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface DrillSetItem {
  id: string;
  customName: string | null;
  durationMin: number;
}

interface DrillSet {
  id: string;
  name: string;
  color: string;
  isPreset: boolean;
  category: string | null;
  items: DrillSetItem[];
}

interface ScheduledTraining {
  id: string;
  date: string;
  title: string;
  category: string | null;
  notes: string | null;
  completed: boolean;
  drillSetId: string | null;
  drillSet: DrillSet | null;
  calendarEventId: string | null;
}

// ── Calendar sync helpers ─────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  PUTTING: 'Putten',
  SHORT_GAME: 'Kurzspiel',
  IRON_PLAY: 'Eisenspiel',
  DRIVING: 'Driver',
  COURSE_MANAGEMENT: 'Platzstrategie',
  MENTAL_GAME: 'Mental',
};

function buildEventPayload(
  title: string,
  date: Date,
  notes: string | null,
  drillSet: DrillSet | null,
  category?: string | null,
) {
  // All-day event: midnight → next midnight
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const lines: string[] = [];

  // Category badge (always shown if available)
  if (category && CATEGORY_LABELS[category]) {
    lines.push(`🏌️ ${CATEGORY_LABELS[category]}`);
    lines.push('');
  }

  if (drillSet) {
    lines.push(`📋 ${drillSet.name}`);
    lines.push('');
    drillSet.items
      .slice()
      .sort((a, b) => (a as any).order - (b as any).order)
      .forEach((item) => {
        lines.push(`• ${item.customName ?? 'Übung'} — ${item.durationMin} Min.`);
      });
    const total = drillSet.items.reduce((s, i) => s + i.durationMin, 0);
    lines.push('');
    lines.push(`⏱ Gesamt: ${total} Min.`);
  } else {
    lines.push(`📋 ${title}`);
    lines.push('Kein Übungsset zugewiesen');
  }

  if (notes) {
    lines.push('');
    lines.push(`📝 ${notes}`);
  }

  lines.push('');
  lines.push('— FairwayIQ Training');

  return {
    title: `⛳ ${title}`,
    notes: lines.join('\n'),
    allDay: true,
    startDate: start,
    endDate: end,
    alarms: [{ relativeOffset: 9 * 60 }], // 9:00 AM
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

async function syncEventUpdate(
  eventId: string,
  title: string,
  date: Date,
  notes: string | null,
  drillSet: DrillSet | null,
  category?: string | null,
) {
  try {
    await ExpoCalendar.updateEventAsync(eventId, buildEventPayload(title, date, notes, drillSet, category));
  } catch {
    // Event was deleted on device — ignore
  }
}

async function deleteCalendarEvent(eventId: string) {
  try {
    await ExpoCalendar.deleteEventAsync(eventId);
  } catch {}
}

const DAY_LABELS_DE = ['Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.', 'So.'];
const DAY_LABELS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Drill Set Picker Row ──────────────────────────────────────────────────────

function DrillSetRow({ set, selected, onSelect }: { set: DrillSet; selected: boolean; onSelect: () => void }) {
  const c = useTheme();
  const totalMin = set.items.reduce((s, i) => s + i.durationMin, 0);
  return (
    <TouchableOpacity
      onPress={onSelect}
      className="flex-row items-center gap-3 rounded-xl px-4 py-3 mb-2"
      style={{
        backgroundColor: c.bgElevated,
        borderWidth: 1,
        borderColor: selected ? set.color : 'transparent',
      }}
    >
      <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: set.color + '30' }}>
        <Ionicons name="barbell-outline" size={15} color={set.color} />
      </View>
      <View className="flex-1">
        <Text className="text-ink-primary text-sm font-semibold">{set.name}</Text>
        <Text className="text-ink-muted text-xs mt-0.5">
          {set.items.length} Übungen · {totalMin} Min.
        </Text>
      </View>
      {selected && <Ionicons name="checkmark-circle" size={18} color={set.color} />}
    </TouchableOpacity>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────

function TrainingModal({
  visible, initialDate, editing, drillSets, onClose, onSaved, onDrillSetsChanged,
}: {
  visible: boolean;
  initialDate?: Date;
  editing?: ScheduledTraining;
  drillSets: DrillSet[];
  onClose: () => void;
  onSaved: () => void;
  onDrillSetsChanged: () => void;
}) {
  const { t, i18n } = useTranslation();
  const c = useTheme();
  const isDE = i18n.language === 'de';

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDrillSetId, setSelectedDrillSetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNewSet, setShowNewSet] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [newSetItems, setNewSetItems] = useState<{ name: string; duration: string }[]>([{ name: '', duration: '10' }]);
  const [creatingSet, setCreatingSet] = useState(false);

  // When editing: original date = lower bound, original date + 7 days = upper bound
  const originalDate = editing ? new Date(editing.date) : null;
  const minDate = originalDate ? new Date(originalDate) : null;
  const maxDate = originalDate ? addDays(originalDate, 7) : null;

  useEffect(() => {
    if (visible) {
      setTitle(editing?.title ?? '');
      setNotes(editing?.notes ?? '');
      setSelectedDate(editing ? new Date(editing.date) : (initialDate ?? new Date()));
      setSelectedDrillSetId(editing?.drillSetId ?? null);
      setShowNewSet(false);
      setNewSetName('');
      setNewSetItems([{ name: '', duration: '10' }]);
    }
  }, [visible]);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        notes: notes.trim() || null,
        date: selectedDate.toISOString(),
        drillSetId: selectedDrillSetId || null,
      };
      if (editing) {
        await api.put(`/calendar/${editing.id}`, body);
        // Auto-sync system calendar if event was previously exported
        if (editing.calendarEventId) {
          const drillSet = drillSets.find((s) => s.id === selectedDrillSetId) ?? null;
          await syncEventUpdate(editing.calendarEventId, title.trim(), selectedDate, notes.trim() || null, drillSet, editing.category);
        }
      } else {
        await api.post('/calendar', body);
      }
      onSaved();
      onClose();
    } catch {
      Alert.alert(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const createSet = async () => {
    if (!newSetName.trim()) return;
    setCreatingSet(true);
    try {
      const items = newSetItems
        .filter((i) => i.name.trim())
        .map((i, idx) => ({ customName: i.name.trim(), durationMin: parseInt(i.duration) || 10, order: idx }));
      const { data } = await api.post<DrillSet>('/calendar/drillsets', { name: newSetName.trim(), items });
      onDrillSetsChanged();
      setSelectedDrillSetId(data.id);
      setShowNewSet(false);
    } catch {
      Alert.alert(t('common.error'));
    } finally {
      setCreatingSet(false);
    }
  };

  const presets = drillSets.filter((s) => s.isPreset);
  const custom = drillSets.filter((s) => !s.isPreset);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: c.bgBase }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
          <View className="px-5 pt-4 pb-3 flex-row items-center gap-3">
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={c.inkPrimary} />
            </TouchableOpacity>
            <Text className="text-ink-primary text-lg font-bold flex-1">
              {editing ? t('calendar.editTraining') : t('calendar.addTraining')}
            </Text>
            <TouchableOpacity
              onPress={save}
              disabled={saving || !title.trim()}
              className="px-4 py-1.5 rounded-xl"
              style={{ backgroundColor: title.trim() ? '#FF6535' : c.bgCard }}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text className="font-bold text-sm" style={{ color: title.trim() ? '#fff' : c.inkMuted }}>{t('common.save')}</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-1.5">
              {t('calendar.titleLabel')}
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('calendar.titlePlaceholder')}
              placeholderTextColor={c.inkMuted}
              className="bg-bg-card rounded-xl px-4 py-3 text-ink-primary text-sm mb-4"
            />

            <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-1.5">
              {t('calendar.dateLabel')}
            </Text>
            <View className="bg-bg-card rounded-xl flex-row items-center justify-between px-4 py-3 mb-4">
              {(() => {
                const canGoBack = !minDate || addDays(selectedDate, -1) >= minDate;
                const canGoForward = !maxDate || addDays(selectedDate, 1) <= maxDate;
                return (
                  <>
                    <TouchableOpacity
                      onPress={() => canGoBack && setSelectedDate((d) => addDays(d, -1))}
                      disabled={!canGoBack}
                    >
                      <Ionicons name="chevron-back" size={20} color={canGoBack ? c.inkMuted : c.inkMuted + '40'} />
                    </TouchableOpacity>
                    <View className="flex-1 items-center">
                      <Text className="text-ink-primary font-semibold text-sm text-center">
                        {selectedDate.toLocaleDateString(isDE ? 'de-DE' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </Text>
                      {maxDate && (
                        <Text className="text-ink-muted text-xs mt-0.5">
                          max. {maxDate.toLocaleDateString(isDE ? 'de-DE' : 'en-US', { day: 'numeric', month: 'short' })}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => canGoForward && setSelectedDate((d) => addDays(d, 1))}
                      disabled={!canGoForward}
                    >
                      <Ionicons name="chevron-forward" size={20} color={canGoForward ? c.inkMuted : c.inkMuted + '40'} />
                    </TouchableOpacity>
                  </>
                );
              })()}
            </View>

            <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-1.5">
              {t('calendar.notesLabel')}
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={t('calendar.notesPlaceholder')}
              placeholderTextColor={c.inkMuted}
              multiline
              numberOfLines={3}
              className="bg-bg-card rounded-xl px-4 py-3 text-ink-primary text-sm mb-4"
              style={{ minHeight: 70, textAlignVertical: 'top' }}
            />

            <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-2">
              {t('calendar.drillSetLabel')}
            </Text>

            {/* No set */}
            <TouchableOpacity
              onPress={() => setSelectedDrillSetId(null)}
              className="flex-row items-center gap-3 rounded-xl px-4 py-3 mb-2"
              style={{
                backgroundColor: c.bgElevated,
                borderWidth: 1,
                borderColor: selectedDrillSetId === null ? '#FF6535' : 'transparent',
              }}
            >
              <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: '#8A8A8A20' }}>
                <Ionicons name="close-circle-outline" size={16} color="#8A8A8A" />
              </View>
              <Text className="text-ink-secondary text-sm flex-1">{t('calendar.noDrillSet')}</Text>
              {selectedDrillSetId === null && <Ionicons name="checkmark-circle" size={18} color="#FF6535" />}
            </TouchableOpacity>

            {presets.length > 0 && (
              <>
                <Text className="text-ink-muted text-xs font-semibold uppercase tracking-wider mt-2 mb-1.5 ml-1">
                  {t('calendar.presets')}
                </Text>
                {presets.map((s) => (
                  <DrillSetRow key={s.id} set={s} selected={selectedDrillSetId === s.id} onSelect={() => setSelectedDrillSetId(s.id)} />
                ))}
              </>
            )}

            {custom.length > 0 && (
              <>
                <Text className="text-ink-muted text-xs font-semibold uppercase tracking-wider mt-3 mb-1.5 ml-1">
                  {t('calendar.custom')}
                </Text>
                {custom.map((s) => (
                  <DrillSetRow key={s.id} set={s} selected={selectedDrillSetId === s.id} onSelect={() => setSelectedDrillSetId(s.id)} />
                ))}
              </>
            )}

            <TouchableOpacity
              onPress={() => setShowNewSet((v) => !v)}
              className="flex-row items-center gap-2 mt-3 mb-2"
            >
              <Ionicons name={showNewSet ? 'chevron-up' : 'add-circle-outline'} size={18} color="#FF6535" />
              <Text className="text-sm font-semibold" style={{ color: '#FF6535' }}>{t('calendar.newSet')}</Text>
            </TouchableOpacity>

            {showNewSet && (
              <View className="bg-bg-card rounded-xl p-4 mb-4">
                <TextInput
                  value={newSetName}
                  onChangeText={setNewSetName}
                  placeholder={t('calendar.setNamePlaceholder')}
                  placeholderTextColor={c.inkMuted}
                  className="text-ink-primary text-sm border-b pb-2 mb-3"
                  style={{ borderBottomColor: c.bgBorder }}
                />
                {newSetItems.map((item, idx) => (
                  <View key={idx} className="flex-row gap-2 mb-2">
                    <TextInput
                      value={item.name}
                      onChangeText={(v) => setNewSetItems((a) => a.map((x, i) => i === idx ? { ...x, name: v } : x))}
                      placeholder={t('calendar.itemName')}
                      placeholderTextColor={c.inkMuted}
                      className="flex-1 bg-bg-base rounded-lg px-3 py-2 text-ink-primary text-sm"
                    />
                    <TextInput
                      value={item.duration}
                      onChangeText={(v) => setNewSetItems((a) => a.map((x, i) => i === idx ? { ...x, duration: v } : x))}
                      keyboardType="number-pad"
                      placeholder="10"
                      placeholderTextColor={c.inkMuted}
                      className="w-14 bg-bg-base rounded-lg px-3 py-2 text-ink-primary text-sm text-center"
                    />
                    <Text className="text-ink-muted text-xs self-center">Min.</Text>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => setNewSetItems((a) => [...a, { name: '', duration: '10' }])}
                  className="flex-row items-center gap-1 mt-1 mb-3"
                >
                  <Ionicons name="add" size={14} color="#FF6535" />
                  <Text className="text-xs" style={{ color: '#FF6535' }}>{t('calendar.addItem')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={createSet}
                  disabled={creatingSet || !newSetName.trim()}
                  className="rounded-xl py-2.5 items-center"
                  style={{ backgroundColor: newSetName.trim() ? '#FF6535' : c.bgBorder }}
                >
                  {creatingSet
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text className="text-white font-bold text-sm">{t('common.save')}</Text>}
                </TouchableOpacity>
              </View>
            )}
            <View className="h-12" />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Day Row ───────────────────────────────────────────────────────────────────

function DayRow({ day, trainings, isToday, isLast, dayLabel, onAdd, onEdit, onDelete, onToggle, onExport }: {
  day: Date;
  trainings: ScheduledTraining[];
  isToday: boolean;
  isLast: boolean;
  dayLabel: string;
  onAdd: () => void;
  onEdit: (t: ScheduledTraining) => void;
  onDelete: (id: string) => void;
  onToggle: (t: ScheduledTraining) => void;
  onExport: (t: ScheduledTraining) => void;
}) {
  const c = useTheme();

  return (
    <View style={{ borderBottomWidth: isLast ? 0 : 1, borderBottomColor: c.bgBorder }}>
      <View className="flex-row items-start px-4 py-3 gap-3">
        {/* Date column */}
        <View className="items-center" style={{ width: 34 }}>
          <Text
            className="text-xs font-bold uppercase tracking-tight"
            style={{ color: isToday ? '#FF6535' : c.inkMuted }}
          >
            {dayLabel}
          </Text>
          <View
            className="w-8 h-8 rounded-full items-center justify-center mt-0.5"
            style={{ backgroundColor: isToday ? '#FF6535' : 'transparent' }}
          >
            <Text
              className="font-bold text-base"
              style={{ color: isToday ? '#fff' : c.inkPrimary }}
            >
              {day.getDate()}
            </Text>
          </View>
        </View>

        {/* Content column */}
        <View className="flex-1 gap-2 pt-0.5">
          {trainings.map((tr) => (
            <View key={tr.id} className="flex-row items-center gap-2">
              {/* Card */}
              <TouchableOpacity
                onPress={() => onEdit(tr)}
                className="flex-1 rounded-xl overflow-hidden flex-row items-center"
                style={{ backgroundColor: c.bgElevated, opacity: tr.completed ? 0.55 : 1 }}
                activeOpacity={0.8}
              >
                {/* Left color strip */}
                <View
                  style={{
                    width: 4,
                    alignSelf: 'stretch',
                    backgroundColor: tr.drillSet?.color ?? '#FF6535',
                    minHeight: 46,
                  }}
                />
                <View className="flex-1 px-3 py-2.5">
                  <Text
                    className="text-ink-primary font-bold text-sm"
                    style={tr.completed ? { textDecorationLine: 'line-through' } : {}}
                    numberOfLines={1}
                  >
                    {tr.title}
                  </Text>
                  {tr.drillSet ? (
                    <Text className="text-ink-muted text-xs mt-0.5" numberOfLines={1}>
                      {tr.drillSet.name} · {tr.drillSet.items.reduce((s, i) => s + i.durationMin, 0)} Min.
                    </Text>
                  ) : tr.category ? (
                    <Text className="text-ink-muted text-xs mt-0.5" numberOfLines={1}>
                      {tr.category.replace('_', ' ')}
                    </Text>
                  ) : null}
                </View>
                {/* Complete toggle */}
                <TouchableOpacity
                  onPress={() => onToggle(tr)}
                  className="px-3"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={tr.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={tr.completed ? '#00e87a' : c.inkMuted}
                  />
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Export to calendar */}
              <TouchableOpacity
                onPress={() => onExport(tr)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Ionicons name="calendar-outline" size={16} color={c.inkMuted} />
              </TouchableOpacity>

              {/* Delete */}
              <TouchableOpacity
                onPress={() => onDelete(tr.id)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Ionicons name="trash-outline" size={16} color={c.inkMuted} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add button */}
          <TouchableOpacity
            onPress={onAdd}
            className="flex-row items-center gap-1.5"
            style={{ paddingVertical: trainings.length === 0 ? 4 : 0 }}
          >
            <Ionicons name="add" size={16} color={c.inkMuted} />
            <Text className="text-sm" style={{ color: c.inkMuted }}>Hinzufügen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Week Section ──────────────────────────────────────────────────────────────

function WeekSection({ weekStart, trainings, dayLabels, isDE, isCurrent, weekIndex, onAdd, onEdit, onDelete, onToggle, onExport, onReset, onLayout }: {
  weekStart: Date;
  trainings: ScheduledTraining[];
  dayLabels: string[];
  isDE: boolean;
  isCurrent: boolean;
  weekIndex: number;
  onAdd: (date: Date) => void;
  onEdit: (t: ScheduledTraining) => void;
  onDelete: (id: string) => void;
  onToggle: (t: ScheduledTraining) => void;
  onExport: (t: ScheduledTraining) => void;
  onReset: () => void;
  onLayout: (y: number) => void;
}) {
  const c = useTheme();
  const today = new Date();
  const weekEnd = addDays(weekStart, 6);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekNum = isoWeek(weekStart);

  const totalMin = trainings.reduce(
    (s, tr) => s + (tr.drillSet?.items.reduce((ss, i) => ss + i.durationMin, 0) ?? 0),
    0,
  );
  const allDone = trainings.length > 0 && trainings.every((tr) => tr.completed);
  const hasDone = trainings.some((tr) => tr.completed);

  const fmtDay = (d: Date) =>
    d.toLocaleDateString(isDE ? 'de-DE' : 'en-US', { day: 'numeric', month: 'short' });

  return (
    <View
      onLayout={(e) => onLayout(e.nativeEvent.layout.y)}
      className="mx-3 mb-3 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: c.bgCard,
        borderWidth: 1,
        borderColor: isCurrent ? '#FF653540' : c.bgBorder,
      }}
    >
      {/* Week header */}
      <View className="px-4 pt-3 pb-2.5">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-row items-center gap-2 flex-1 flex-wrap">
            <Text className="text-ink-primary font-bold text-sm">
              {fmtDay(weekStart)}–{fmtDay(weekEnd)}
            </Text>
            <View
              className="flex-row items-center gap-1 px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: allDone ? '#00e87a' : isCurrent ? '#FF6535' : c.bgElevated,
              }}
            >
              <Text
                className="text-xs font-black tracking-wide"
                style={{ color: allDone || isCurrent ? '#fff' : c.inkSecondary }}
              >
                KW {weekNum}
              </Text>
              {allDone && <Ionicons name="checkmark" size={10} color="#fff" />}
            </View>
          </View>

          <View className="flex-row gap-2 items-center">
            {/* Calendar sync indicator */}
            {trainings.length > 0 && (() => {
              const synced = trainings.filter((tr) => tr.calendarEventId).length;
              return synced > 0 ? (
                <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: '#00e87a20' }}>
                  <Ionicons name="calendar" size={10} color="#00e87a" />
                  <Text className="text-xs font-semibold" style={{ color: '#00e87a' }}>
                    {synced}/{trainings.length}
                  </Text>
                </View>
              ) : null;
            })()}
            {hasDone && (
              <TouchableOpacity
                onPress={onReset}
                className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: c.bgElevated }}
              >
                <Ionicons name="refresh-outline" size={12} color={c.inkSecondary} />
                <Text className="text-xs" style={{ color: c.inkSecondary }}>Zurücksetzen</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {totalMin > 0 && (
          <Text className="text-ink-muted text-xs mt-1">Gesamt: {totalMin} Min.</Text>
        )}
      </View>

      <View style={{ height: 1, backgroundColor: c.bgBorder }} />

      {/* Day rows */}
      {weekDays.map((day, i) => {
        const dayTrainings = trainings.filter((tr) => isSameDay(new Date(tr.date), day));
        return (
          <DayRow
            key={i}
            day={day}
            trainings={dayTrainings}
            isToday={isSameDay(day, today)}
            isLast={i === 6}
            dayLabel={dayLabels[i]}
            onAdd={() => onAdd(day)}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggle={onToggle}
            onExport={onExport}
          />
        );
      })}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { t, i18n } = useTranslation();
  const c = useTheme();
  const isDE = i18n.language === 'de';
  const dayLabels = isDE ? DAY_LABELS_DE : DAY_LABELS_EN;

  const scrollRef = useRef<ScrollView>(null);
  const weekYOffsets = useRef<Record<number, number>>({});

  const today = new Date();
  const currentWeekStart = startOfWeek(today);

  // 4 past + current + 12 future = 17 weeks
  const PAST_WEEKS = 4;
  const weeks = Array.from({ length: 17 }, (_, i) => addDays(currentWeekStart, (i - PAST_WEEKS) * 7));

  const [trainings, setTrainings] = useState<ScheduledTraining[]>([]);
  const [drillSets, setDrillSets] = useState<DrillSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFloating, setShowFloating] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalDate, setModalDate] = useState<Date>(new Date());
  const [editingTraining, setEditingTraining] = useState<ScheduledTraining | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = weeks[0].toISOString();
      const to = addDays(weeks[weeks.length - 1], 7).toISOString();
      const [tRes, dRes] = await Promise.all([
        api.get<ScheduledTraining[]>(`/calendar?from=${from}&to=${to}`),
        api.get<DrillSet[]>('/calendar/drillsets'),
      ]);
      setTrainings(tRes.data);
      setDrillSets(dRes.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const scrollToCurrentWeek = () => {
    const y = weekYOffsets.current[PAST_WEEKS];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
    }
  };

  // Scroll to current week after first load
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(scrollToCurrentWeek, 150);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const trainingsForWeek = (ws: Date) => {
    const end = addDays(ws, 7);
    return trainings.filter((tr) => {
      const d = new Date(tr.date);
      return d >= ws && d < end;
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert(t('calendar.deleteTraining'), t('calendar.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            const training = trainings.find((tr) => tr.id === id);
            await api.delete(`/calendar/${id}`);
            if (training?.calendarEventId) {
              await deleteCalendarEvent(training.calendarEventId);
            }
            load();
          } catch {}
        },
      },
    ]);
  };

  const handleToggle = async (training: ScheduledTraining) => {
    try { await api.put(`/calendar/${training.id}`, { completed: !training.completed }); load(); } catch {}
  };

  const handleReset = async (ws: Date) => {
    const toReset = trainingsForWeek(ws).filter((tr) => tr.completed);
    await Promise.all(toReset.map((tr) => api.put(`/calendar/${tr.id}`, { completed: false }).catch(() => {})));
    load();
  };

  const getSystemCalendar = async () => {
    const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') return null;
    const cals = await ExpoCalendar.getCalendarsAsync(ExpoCalendar.EntityTypes.EVENT);
    return cals.find((c) => c.isPrimary) ?? cals.find((c) => c.allowsModifications) ?? cals[0] ?? null;
  };

  const [exporting, setExporting] = useState(false);

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const cal = await getSystemCalendar();
      if (!cal) { setExporting(false); return; }

      let count = 0;
      await Promise.all(
        trainings.map(async (tr) => {
          try {
            const payload = buildEventPayload(tr.title, new Date(tr.date), tr.notes, tr.drillSet, tr.category);
            let eventId = tr.calendarEventId;

            if (eventId) {
              // Update existing calendar event
              try {
                await ExpoCalendar.updateEventAsync(eventId, payload);
              } catch {
                // Event no longer exists on device — recreate
                eventId = await ExpoCalendar.createEventAsync(cal.id, payload);
              }
            } else {
              eventId = await ExpoCalendar.createEventAsync(cal.id, payload);
            }

            // Save calendarEventId back to backend
            await api.put(`/calendar/${tr.id}`, { calendarEventId: eventId });
            count++;
          } catch {}
        }),
      );

      await load();
      Alert.alert('', `${count} ${t('calendar.exportAllSuccess')}`);
    } catch {
      Alert.alert(t('common.error'), t('calendar.exportError'));
    } finally {
      setExporting(false);
    }
  };

  // Single export (keeps per-card button working too)
  const handleExport = async (training: ScheduledTraining) => {
    try {
      const cal = await getSystemCalendar();
      if (!cal) return;
      const payload = buildEventPayload(training.title, new Date(training.date), training.notes, training.drillSet, training.category);
      let eventId = training.calendarEventId;
      if (eventId) {
        try { await ExpoCalendar.updateEventAsync(eventId, payload); } catch {
          eventId = await ExpoCalendar.createEventAsync(cal.id, payload);
        }
      } else {
        eventId = await ExpoCalendar.createEventAsync(cal.id, payload);
      }
      await api.put(`/calendar/${training.id}`, { calendarEventId: eventId });
      await load();
      Alert.alert('', t('calendar.exportSuccess'));
    } catch {
      Alert.alert(t('common.error'), t('calendar.exportError'));
    }
  };

  const reloadDrillSets = async () => {
    try { const { data } = await api.get<DrillSet[]>('/calendar/drillsets'); setDrillSets(data); } catch {}
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={c.inkPrimary} />
        </TouchableOpacity>
        <Text className="text-ink-primary text-xl font-bold flex-1">{t('calendar.title')}</Text>
        {trainings.length > 0 && (
          <TouchableOpacity
            onPress={handleExportAll}
            disabled={exporting}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: c.bgCard }}
          >
            {exporting
              ? <ActivityIndicator size="small" color="#FF6535" />
              : <Ionicons name="calendar-outline" size={16} color="#FF6535" />}
            <Text className="text-xs font-bold" style={{ color: '#FF6535' }}>
              {t('calendar.exportAll')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color="#FF6535" className="mt-20" />
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 120 }}
            onScroll={(e) => {
              const scrollY = e.nativeEvent.contentOffset.y;
              const currentY = weekYOffsets.current[PAST_WEEKS] ?? 0;
              setShowFloating(Math.abs(scrollY - currentY) > 200);
            }}
            scrollEventThrottle={100}
          >
            {weeks.map((ws, idx) => (
              <WeekSection
                key={ws.toISOString()}
                weekStart={ws}
                trainings={trainingsForWeek(ws)}
                dayLabels={dayLabels}
                isDE={isDE}
                isCurrent={idx === PAST_WEEKS}
                weekIndex={idx}
                onAdd={(date) => {
                  setModalDate(date);
                  setEditingTraining(undefined);
                  setModalVisible(true);
                }}
                onEdit={(tr) => {
                  setEditingTraining(tr);
                  setModalDate(new Date(tr.date));
                  setModalVisible(true);
                }}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onExport={handleExport}
                onReset={() => handleReset(ws)}
                onLayout={(y) => { weekYOffsets.current[idx] = y; }}
              />
            ))}
          </ScrollView>

          {/* Floating "Zu dieser Woche" button */}
          {showFloating && (
            <View
              style={{ position: 'absolute', bottom: 32, left: 0, right: 0, alignItems: 'center' }}
              pointerEvents="box-none"
            >
              <TouchableOpacity
                onPress={scrollToCurrentWeek}
                className="flex-row items-center gap-2 px-5 py-3 rounded-full"
                style={{ backgroundColor: c.inkPrimary, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}
              >
                <Ionicons name="arrow-up" size={15} color={c.bgBase} />
                <Text className="font-black text-sm tracking-widest" style={{ color: c.bgBase }}>
                  {t('calendar.thisWeek').toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <TrainingModal
        visible={modalVisible}
        initialDate={modalDate}
        editing={editingTraining}
        drillSets={drillSets}
        onClose={() => setModalVisible(false)}
        onSaved={load}
        onDrillSetsChanged={reloadDrillSets}
      />
    </SafeAreaView>
  );
}
