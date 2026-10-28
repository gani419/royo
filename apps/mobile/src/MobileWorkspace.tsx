import { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  useWindowDimensions,
  Linking,
  Alert,
} from "react-native";
import {
  Sparkles,
  Bike,
  Wrench,
  History,
  LogOut,
  ShieldCheck,
} from "lucide-react-native";
import {
  useAuthSession,
  useVehicleManager,
  useAIChat,
  useAIQuota,
  useMaintenance,
} from "@royo/features";
import { tokens as t } from "@royo/theme";
import { styles as s } from "./styles";
import { Action, AuthForm, VehicleForm, ServiceForm } from "./screens/Forms";

const tabs = [
  { id: "assistant", label: "Assistant", icon: Sparkles },
  { id: "garage", label: "Garage", icon: Bike },
  { id: "logbook", label: "Logbook", icon: Wrench },
  { id: "history", label: "History", icon: History },
] as const;
type Tab = (typeof tabs)[number]["id"];
const prompts = [
  "My engine makes a rattling sound when accelerating.",
  "My brakes squeal when slowing down.",
  "My motorcycle struggles to start when cold.",
  "How can I safely inspect my drive chain?",
];

export function MobileWorkspace() {
  const auth = useAuthSession();
  const garage = useVehicleManager();
  const chat = useAIChat(garage.activeVehicle);
  const quota = useAIQuota();
  const maintenance = useMaintenance(garage.activeVehicle);
  const [tab, setTab] = useState<Tab>("assistant");
  const [modal, setModal] = useState<"auth" | "vehicle" | "service" | null>(
    null,
  );
  const { width } = useWindowDimensions();
  const rail = width >= t.compact;
  const split = width >= t.expanded;
  const vehicle = garage.activeVehicle;
  useEffect(() => {
    void auth.checkSession();
  }, [auth.checkSession]);
  const setup = () => setModal(auth.isAuthenticated ? "vehicle" : "auth");
  const nav = (
    <View style={rail ? s.rail : s.nav}>
      {tabs.map((n) => (
        <TouchableOpacity
          key={n.id}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === n.id }}
          style={[
            s.navButton,
            rail && s.railButton,
            tab === n.id && s.selected,
          ]}
          onPress={() => setTab(n.id)}
        >
          <n.icon size={21} color={tab === n.id ? t.brand : t.muted} />
          <Text style={[s.navText, tab === n.id && s.selectedText]}>
            {n.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  const empty = (
    <View style={s.card}>
      <Bike color={t.brand} size={40} />
      <Text style={s.heading}>Every ride has a story.</Text>
      <Text style={s.subtitle}>
        Add your motorcycle for guidance with the right vehicle context and a
        real service history.
      </Text>
      <Action onPress={setup}>
        {auth.isAuthenticated ? "Add motorcycle" : "Sign in to get started"}
      </Action>
    </View>
  );
  const context = (
    <View style={s.card}>
      <Text style={s.eyebrow}>YOUR RIDE</Text>
      <Bike color={t.brand} size={48} />
      <Text style={s.heading}>
        {vehicle?.nickname || vehicle?.model.name || "Make it your garage."}
      </Text>
      <Text style={s.subtitle}>
        {vehicle
          ? `${vehicle.model.manufacturer?.name ?? ""} · ${vehicle.modelYear} · ${vehicle.odometerKm.toLocaleString()} km`
          : "A little knowledge. A more confident ride."}
      </Text>
      <Action secondary onPress={() => (vehicle ? setTab("garage") : setup())}>
        {vehicle ? "Manage garage" : "Add motorcycle"}
      </Action>
    </View>
  );
  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={t.surface} />
      <View style={s.header}>
        <Image
          source={require("../../../packages/theme/assets/images/royo-wordmark.png")}
          style={s.logo}
          accessibilityLabel="ROYO — Repair On Your Own"
        />
        <View style={s.row}>
          {auth.isAuthenticated ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              style={s.chip}
              onPress={() => void auth.logout()}
            >
              <LogOut size={18} color={t.brand} />
            </TouchableOpacity>
          ) : (
            <Action onPress={() => setModal("auth")}>Sign in</Action>
          )}
        </View>
      </View>
      <KeyboardAvoidingView
        style={s.workspace}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[s.workspace, rail && s.workspaceWide]}>
          {rail && nav}
          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.content}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={s.eyebrow}>YOUR RIDING COMPANION</Text>
            <Text style={s.title}>
              {tab === "assistant"
                ? "A better understanding.\nA better ride."
                : tab === "garage"
                  ? "Your motorcycles.\nAll in one place."
                  : tab === "logbook"
                    ? "A little care goes\na long way."
                    : "Pick up where\nyou left off."}
            </Text>
            <Text style={s.subtitle}>
              Understand your vehicle. Maintain with confidence.
            </Text>
            {tab === "assistant" && (
              <View style={split ? s.split : undefined}>
                <View style={s.mainColumn}>
                  <View style={s.card}>
                    <View style={s.row}>
                      <Sparkles color={t.brand} size={22} />
                      <Text style={s.heading}>Your repair companion</Text>
                    </View>
                    <Text style={s.small}>
                      {vehicle
                        ? `${vehicle.model.name} · ${quota.quota ? quota.effectiveRemaining : "—"} messages left today`
                        : "Sign in and add a motorcycle to start."}
                    </Text>
                    {!chat.messages.length && (
                      <>
                        <Text style={s.heading}>
                          Let’s understand your motorcycle.
                        </Text>
                        <Text style={s.subtitle}>
                          Describe a sound, vibration, or change you’ve noticed.
                          We’ll help you find a sensible next step.
                        </Text>
                        <View style={s.suggestionGrid}>
                          {prompts.map((p, i) => (
                            <TouchableOpacity
                              accessibilityRole="button"
                              key={p}
                              onPress={() => chat.setDraft(p)}
                              style={s.suggestion}
                            >
                              <Wrench size={18} color={t.brand} />
                              <Text style={s.suggestionText}>
                                {
                                  [
                                    "Engine sounds",
                                    "Brake concerns",
                                    "Cold starts",
                                    "Everyday care",
                                  ][i]
                                }
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    )}
                    {chat.messages.map((m) => (
                      <View
                        key={m.id}
                        style={[
                          s.message,
                          m.senderType === "user" && s.userMessage,
                        ]}
                      >
                        <Text style={s.eyebrow}>
                          {m.senderType === "user"
                            ? "YOU"
                            : "ROYO · AI GUIDANCE"}
                        </Text>
                        <Text style={s.text} selectable>
                          {m.content}
                        </Text>
                        {m.structuredData && (
                          <>
                            {m.structuredData.possibleCauses?.map((c, i) => (
                              <View key={i}>
                                <Text style={s.label}>{c.component}</Text>
                                <Text style={s.subtitle}>{c.explanation}</Text>
                              </View>
                            ))}
                            {m.structuredData.troubleshootingSteps?.map(
                              (step, i) => (
                                <View key={i}>
                                  <Text style={s.text}>
                                    {i + 1}. {step.instruction}
                                  </Text>
                                  <Text style={s.small}>
                                    {step.safetyPrecaution}
                                  </Text>
                                </View>
                              ),
                            )}
                            {m.structuredData.safetyWarnings?.map(
                              (warning, i) => (
                                <Text key={i} style={s.warning}>
                                  {warning}
                                </Text>
                              ),
                            )}
                            {m.structuredData.professionalHelpRecommended && (
                              <Text style={s.error}>
                                Professional mechanic assistance recommended.
                              </Text>
                            )}
                            {m.structuredData.followUpQuestions?.map((q) => (
                              <Action
                                key={q}
                                secondary
                                onPress={() => chat.setDraft(q)}
                              >
                                {q}
                              </Action>
                            ))}
                          </>
                        )}
                        {m.videos
                          ?.filter((v) =>
                            /^https:\/\/(www\.)?youtube\.com\//.test(
                              v.videoUrl,
                            ),
                          )
                          .map((v) => (
                            <Action
                              secondary
                              key={v.id}
                              onPress={() => void Linking.openURL(v.videoUrl)}
                            >
                              {v.title} · {v.channelTitle}
                            </Action>
                          ))}
                      </View>
                    ))}
                    {chat.chatError && (
                      <Text style={s.error} accessibilityRole="alert">
                        {chat.chatError}
                      </Text>
                    )}
                    {(chat.isGenerating || chat.isLoadingMessages) && (
                      <Text style={s.subtitle} accessibilityLiveRegion="polite">
                        {chat.isGenerating
                          ? "Working through your question…"
                          : "Loading conversation…"}
                      </Text>
                    )}
                    <TextInput
                      style={[s.input, s.textarea]}
                      multiline
                      accessibilityLabel="Describe your motorcycle issue"
                      placeholder="Describe what you’re noticing…"
                      placeholderTextColor={t.muted}
                      maxLength={1000}
                      value={chat.currentDraft}
                      onChangeText={chat.setDraft}
                    />
                    <Action
                      disabled={
                        chat.isGenerating ||
                        chat.isLoadingMessages ||
                        chat.currentDraft.trim().length < 5
                      }
                      onPress={() => {
                        if (!auth.isAuthenticated || !vehicle) setup();
                        else void chat.sendMessage(chat.currentDraft);
                      }}
                    >
                      {chat.isGenerating ? "Working…" : "Ask ROYO"}
                    </Action>
                    <Text style={s.small}>
                      AI can make mistakes. Guidance is not a diagnosis or
                      confirmation that your motorcycle is safe to ride.
                    </Text>
                    <Action
                      secondary
                      disabled={chat.isGenerating}
                      onPress={() => chat.selectSession(null)}
                    >
                      New conversation
                    </Action>
                  </View>
                  <View style={s.warning}>
                    <ShieldCheck size={22} color={t.brand} />
                    <Text style={s.label}>Confidence starts with care.</Text>
                    <Text style={s.small}>
                      Brake, steering, fuel leak, or electrical concerns? Stop
                      riding and get a qualified mechanic’s help.
                    </Text>
                  </View>
                </View>
                {split && <View style={s.contextColumn}>{context}</View>}
              </View>
            )}
            {tab === "garage" && (
              <>
                {garage.error && (
                  <>
                    <Text style={s.error} accessibilityRole="alert">
                      {garage.error}
                    </Text>
                    <Action secondary onPress={() => void garage.refresh()}>
                      Retry garage
                    </Action>
                  </>
                )}
                {garage.vehicles.length
                  ? garage.vehicles.map((v) => (
                      <View
                        key={v.id}
                        style={[s.card, v.id === vehicle?.id && s.cardSelected]}
                      >
                        <Bike size={52} color={t.brand} />
                        <Text style={s.heading}>
                          {v.nickname || v.model.name}
                        </Text>
                        <Text style={s.subtitle}>
                          {v.model.manufacturer?.name} · {v.model.name}
                        </Text>
                        <Text style={s.text}>
                          {v.modelYear} · {v.odometerKm.toLocaleString()} km ·{" "}
                          {v.model.engineDisplacementCc} cc
                        </Text>
                        <Action
                          disabled={chat.isGenerating}
                          onPress={() => {
                            garage.selectVehicle(v.id);
                            setTab("assistant");
                          }}
                        >
                          Ask about this ride
                        </Action>
                        <Action
                          secondary
                          disabled={chat.isGenerating}
                          onPress={() => {
                            garage.selectVehicle(v.id);
                            setTab("logbook");
                          }}
                        >
                          View service logbook
                        </Action>
                      </View>
                    ))
                  : empty}
                <Action onPress={setup}>Add motorcycle</Action>
              </>
            )}
            {(tab === "logbook" || tab === "history") && vehicle && (
              <ScrollView horizontal contentContainerStyle={s.row}>
                {garage.vehicles.map((v) => (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{ selected: v.id === vehicle.id }}
                    disabled={chat.isGenerating}
                    key={v.id}
                    style={[s.chip, v.id === vehicle.id && s.chipSelected]}
                    onPress={() => garage.selectVehicle(v.id)}
                  >
                    <Text style={s.text}>{v.nickname || v.model.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            {tab === "logbook" &&
              (vehicle ? (
                <>
                  <Action onPress={() => setModal("service")}>
                    Log service
                  </Action>
                  {maintenance.error && (
                    <Text style={s.error} accessibilityRole="alert">
                      {maintenance.error}
                    </Text>
                  )}
                  {maintenance.isLoading && (
                    <Text style={s.small}>Loading service history…</Text>
                  )}
                  {maintenance.records.length ? (
                    maintenance.records.map((r) => (
                      <View key={r.id} style={s.card}>
                        <Text style={s.small}>
                          {new Date(r.serviceDate).toLocaleDateString()} ·{" "}
                          {r.odometerAtService.toLocaleString()} km
                        </Text>
                        <Text style={s.heading}>{r.title}</Text>
                        {r.description && (
                          <Text style={s.subtitle}>{r.description}</Text>
                        )}
                        {r.cost !== undefined && (
                          <Text style={s.label}>
                            INR {r.cost.toLocaleString("en-IN")}
                          </Text>
                        )}
                      </View>
                    ))
                  ) : (
                    <View style={s.card}>
                      <Text style={s.heading}>A fresh service history.</Text>
                      <Text style={s.subtitle}>
                        Record your first service or small improvement.
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                empty
              ))}
            {tab === "history" &&
              (vehicle ? (
                <>
                  {chat.sessions.filter((c) => c.vehicleId === vehicle.id)
                    .length ? (
                    chat.sessions
                      .filter((c) => c.vehicleId === vehicle.id)
                      .map((c) => (
                        <View key={c.id} style={s.card}>
                          <Text style={s.heading}>{c.title}</Text>
                          <Text style={s.small}>
                            {new Date(c.createdAt).toLocaleDateString()}
                          </Text>
                          <Action
                            disabled={chat.isGenerating}
                            onPress={() => {
                              chat.selectSession(c.id);
                              setTab("assistant");
                            }}
                          >
                            Resume conversation
                          </Action>
                          <Action
                            secondary
                            disabled={chat.isGenerating}
                            onPress={() =>
                              Alert.alert(
                                "Delete conversation?",
                                "This cannot be undone.",
                                [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Delete",
                                    style: "destructive",
                                    onPress: () =>
                                      void chat.deleteSession(c.id),
                                  },
                                ],
                              )
                            }
                          >
                            Delete conversation
                          </Action>
                        </View>
                      ))
                  ) : (
                    <View style={s.card}>
                      <Text style={s.heading}>Good questions belong here.</Text>
                      <Text style={s.subtitle}>
                        Your saved conversations for this ride will appear here.
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                empty
              ))}
          </ScrollView>
        </View>
        {!rail && nav}
      </KeyboardAvoidingView>
      <Modal
        visible={modal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModal(null)}
      >
        <SafeAreaView style={s.modal}>
          <KeyboardAvoidingView
            style={s.workspace}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <ScrollView
              contentContainerStyle={s.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              <Action secondary onPress={() => setModal(null)}>
                Close
              </Action>
              {modal === "auth" && <AuthForm onDone={() => setModal(null)} />}{" "}
              {modal === "vehicle" && (
                <VehicleForm
                  onAdd={garage.addVehicle}
                  onDone={() => setModal(null)}
                />
              )}{" "}
              {modal === "service" && vehicle && (
                <ServiceForm
                  vehicle={vehicle}
                  onSave={maintenance.addRecord}
                  onDone={() => {
                    setModal(null);
                    void garage.refresh();
                  }}
                />
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
