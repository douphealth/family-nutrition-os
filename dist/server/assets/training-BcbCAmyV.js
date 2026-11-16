import { H as Button, U as cn, c as todayKey, d as useStore, s as setState, t as useI18n } from "./i18n-Bg74tMYw.js";
import { i as useToday, n as MemberSwitcher } from "./AppShell-Dn_obJbp.js";
import { t as Input } from "./input-BaDDcapO.js";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Crosshair, Dumbbell, ExternalLink, Eye, Moon, Pause, Play, Plus, RotateCcw, Save, ShieldCheck, Timer, Trash2, Undo2, Upload, X, Youtube } from "lucide-react";
import { toast } from "sonner";
//#region src/assets/basketball-court.jpg
var basketball_court_default = "/family-nutrition-os/assets/basketball-court-Dt-typmh.jpg";
//#endregion
//#region src/training/fitness-calendar.js
/**
* ZENITH PRO · date-specific, local-only family activity calendar.
* The seven-day Dimitris timetable is transcribed from the family-provided
* calendar screenshot for 2–8 November 2026. It is NOT a recurring fixture.
* No Google account, location tracking or external request is involved.
*/
var DIMITRIS_CALENDAR_WEEK = "2026-11-02";
var CALENDAR_EVENT_TYPES = [
	"school",
	"team",
	"game"
];
var datePattern = /^\d{4}-\d{2}-\d{2}$/;
var timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
var days = [
	"MO",
	"TU",
	"WE",
	"TH",
	"FR",
	"SA",
	"SU"
];
var safe = (v) => String(v ?? "").trim().slice(0, 90);
var basketballVenue = "ΣΤ. ΚΑΛΑΪΤΖΗΣ";
var isTentativeEvent = (event) => [
	"tentative",
	"game-status-unconfirmed",
	"repeated-unverified"
].includes(event?.note);
var weekOf = (date) => {
	const d = /* @__PURE__ */ new Date(date + "T12:00:00Z");
	if (!datePattern.test(date) || !Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== date) return null;
	d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
	return d.toISOString().slice(0, 10);
};
var addDays = (date, increment) => {
	const d = /* @__PURE__ */ new Date(date + "T12:00:00Z");
	d.setUTCDate(d.getUTCDate() + increment);
	return d.toISOString().slice(0, 10);
};
var timeMinutes = (value) => timePattern.test(String(value)) ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : null;
function eventDuration(event) {
	const a = timeMinutes(event?.start), b = timeMinutes(event?.end);
	return a === null || b === null || b <= a ? 0 : b - a;
}
var make = (date, type, start, end, venue = "", note = "") => ({
	id: type + "-" + date + "-" + start.replace(":", ""),
	date,
	type,
	start,
	end,
	title: type === "school" ? "ΣΧΟΛΕΙΟ" : "ΜΠΑΣΚΕΤ",
	venue,
	note
});
var DIMITRIS_SCREENSHOT_EVENTS = Object.freeze([
	make("2026-11-02", "school", "08:00", "15:30", "ΠΑΛΛΗΝΗ"),
	make("2026-11-02", "team", "20:30", "22:15", basketballVenue),
	make("2026-11-03", "school", "08:00", "15:30", "ΠΑΛΛΗΝΗ"),
	make("2026-11-03", "team", "20:30", "23:55", "MATCH DAY", "game-status-unconfirmed"),
	make("2026-11-04", "school", "08:00", "15:30", "ΠΑΛΛΗΝΗ"),
	make("2026-11-05", "school", "08:00", "15:30", "ΠΑΛΛΗΝΗ"),
	make("2026-11-05", "team", "21:00", "22:15", basketballVenue),
	make("2026-11-06", "school", "08:00", "15:30", "ΠΑΛΛΗΝΗ"),
	make("2026-11-06", "team", "20:15", "22:15", basketballVenue),
	make("2026-11-07", "team", "12:00", "13:30", "BASKETAKI ARENA"),
	make("2026-11-08", "team", "11:00", "13:30", basketballVenue)
]);
function cleanCalendarEvents(events, start) {
	if (!Array.isArray(events) || !weekOf(start) || weekOf(start) !== start) return [];
	const seen = /* @__PURE__ */ new Set(), out = [];
	for (const raw of events.slice(0, 120)) {
		const date = String(raw?.date || ""), type = raw?.type;
		const startTime = String(raw?.start || ""), endTime = String(raw?.end || "");
		if (!CALENDAR_EVENT_TYPES.includes(type) || weekOf(date) !== start) continue;
		if (!timePattern.test(startTime) || !timePattern.test(endTime) || timeMinutes(endTime) <= timeMinutes(startTime)) continue;
		if (timeMinutes(endTime) - timeMinutes(startTime) > 720) continue;
		const id = safe(raw?.id) || type + "-" + date + "-" + startTime.replace(":", "");
		const dedupe = [
			date,
			type,
			startTime,
			endTime
		].join("|");
		if (seen.has(dedupe)) continue;
		seen.add(dedupe);
		out.push({
			id,
			date,
			type,
			start: startTime,
			end: endTime,
			title: safe(raw?.title) || (type === "school" ? "ΣΧΟΛΕΙΟ" : "ΜΠΑΣΚΕΤ"),
			venue: safe(raw?.venue),
			note: safe(raw?.note)
		});
	}
	return out.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start) || a.type.localeCompare(b.type));
}
function cleanCalendarWeeks(weeks) {
	if (!weeks || typeof weeks !== "object" || Array.isArray(weeks)) return {};
	const result = {};
	for (const key of Object.keys(weeks).sort().slice(-32)) {
		if (weekOf(key) !== key) continue;
		result[key] = cleanCalendarEvents(weeks[key], key);
	}
	return result;
}
function defaultDimitrisCalendar() {
	return { [DIMITRIS_CALENDAR_WEEK]: cleanCalendarEvents(DIMITRIS_SCREENSHOT_EVENTS, DIMITRIS_CALENDAR_WEEK) };
}
/**
* A dated week is authoritative only for itself. Repetition must be explicitly
* enabled by the family; otherwise future weeks remain unverified (and extra
* workouts are NOT invented).
*/
function resolveCalendarWeek(settings, start) {
	const weeks = cleanCalendarWeeks(settings?.calendarWeeks);
	if (Object.hasOwn(weeks, start)) return {
		events: weeks[start],
		known: true,
		source: start === "2026-11-02" && settings?.calendarSource === "family-screenshot" ? "screenshot" : "saved",
		repeated: false
	};
	if (settings?.repeatWeekly === true) {
		const base = weekOf(String(settings?.repeatFromWeek || "")) === settings.repeatFromWeek ? settings.repeatFromWeek : Object.keys(weeks).sort().at(-1);
		if (base && start >= base && weeks[base]) return {
			events: weeks[base].map((x) => {
				const date = addDays(start, Math.round((Date.parse(x.date + "T12:00:00Z") - Date.parse(base + "T12:00:00Z")) / 864e5));
				return {
					...x,
					id: x.type + "-" + date + "-" + x.start.replace(":", ""),
					date,
					note: x.note === "game-status-unconfirmed" ? x.note : "repeated-unverified"
				};
			}),
			known: true,
			source: "manual-repeat",
			repeated: true
		};
	}
	return {
		events: [],
		known: false,
		source: "unconfirmed",
		repeated: false
	};
}
function summarizeCalendarEvents(events) {
	let teamMinutes = 0, schoolMinutes = 0, lateNights = 0;
	const sportDates = /* @__PURE__ */ new Set(), schoolDates = /* @__PURE__ */ new Set();
	for (const ev of events) {
		const min = eventDuration(ev);
		if (ev.type === "school") {
			schoolMinutes += min;
			schoolDates.add(ev.date);
		} else if ((ev.type === "team" || ev.type === "game") && !isTentativeEvent(ev)) {
			teamMinutes += min;
			sportDates.add(ev.date);
			if (timeMinutes(ev.end) >= 1320) lateNights++;
		}
	}
	const school = events.filter((e) => e.type === "school");
	const practices = events.filter((e) => (e.type === "team" || e.type === "game") && !isTentativeEvent(e));
	const turnarounds = [];
	for (const event of practices) {
		const d = /* @__PURE__ */ new Date(event.date + "T12:00:00Z");
		d.setUTCDate(d.getUTCDate() + 1);
		const nextDate = d.toISOString().slice(0, 10);
		for (const next of school.filter((x) => x.date === nextDate)) {
			const gap = 1440 - timeMinutes(event.end) + timeMinutes(next.start);
			turnarounds.push({
				from: event.date,
				to: next.date,
				minutes: gap
			});
		}
	}
	turnarounds.sort((a, b) => a.minutes - b.minutes);
	const tentativeMinutes = events.filter((e) => (e.type === "team" || e.type === "game") && isTentativeEvent(e)).reduce((sum, e) => sum + eventDuration(e), 0);
	return {
		teamMinutes,
		tentativeMinutes,
		schoolMinutes,
		teamDays: sportDates.size,
		schoolDays: schoolDates.size,
		lateNights,
		shortestSchoolTurnaround: turnarounds[0] || null
	};
}
function localDateTime(raw, parameters = "") {
	if (/VALUE=DATE/i.test(parameters) || !/^\d{8}T\d{6}Z?$/.test(raw)) return null;
	let date = raw.slice(0, 4) + "-" + raw.slice(4, 6) + "-" + raw.slice(6, 8), time = raw.slice(9, 11) + ":" + raw.slice(11, 13);
	if (raw.endsWith("Z")) {
		const instant = new Date(Date.UTC(Number(raw.slice(0, 4)), Number(raw.slice(4, 6)) - 1, Number(raw.slice(6, 8)), Number(raw.slice(9, 11)), Number(raw.slice(11, 13)), Number(raw.slice(13, 15))));
		if (!Number.isFinite(instant.getTime())) return null;
		const parts = new Intl.DateTimeFormat("en-US", {
			timeZone: "Europe/Athens",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hourCycle: "h23"
		}).formatToParts(instant);
		const d = Object.fromEntries(parts.map((p) => [p.type, p.value]));
		date = d.year + "-" + d.month + "-" + d.day;
		time = d.hour + ":" + d.minute;
	} else if (/TZID=/i.test(parameters) && !/TZID="?Europe\/Athens"?/i.test(parameters)) return null;
	if (!weekOf(date) || timeMinutes(time) === null) return null;
	return {
		date,
		time
	};
}
function parseProperty(line) {
	const idx = line.indexOf(":");
	if (idx < 0) return null;
	const field = line.slice(0, idx), name = field.split(";")[0].toUpperCase();
	return {
		name,
		params: field.slice(name.length),
		value: line.slice(idx + 1)
	};
}
function classifyEvent(summary) {
	const txt = summary.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("el");
	if (/σχολε|school|classes|μαθηματα/.test(txt)) return "school";
	if (/μπασκετ|basket|basketball|καλαθοσφαιρ/.test(txt)) return /αγων|match|game|ματς/.test(txt) ? "game" : "team";
	return null;
}
/**
* Parse an exported .ics calendar entirely in-browser.
* Supports single timed VEVENTs and conservative WEEKLY RRULE occurrences,
* limited to 26 weeks from the supplied start. Ambiguous/all-day events,
* unrelated personal events and unsupported TZIDs are ignored, never stored.
* This is an IMPORT, not unattended calendar synchronization.
*/
function parseFitnessIcs(text) {
	if (typeof text !== "string" || text.length > 1024 * 1024) throw new Error("Calendar file too large (limit 1 MiB)");
	const lines = text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "").split("\n");
	const result = {
		weeks: {},
		imported: 0,
		skipped: 0,
		recurring: 0
	};
	let item = null;
	const add = (ev) => {
		const start = weekOf(ev.date);
		if (!start || result.imported >= 500) return;
		result.weeks[start] ||= [];
		result.weeks[start].push(ev);
		result.imported++;
	};
	for (const line of lines) {
		if (line === "BEGIN:VEVENT") {
			item = [];
			continue;
		}
		if (line === "END:VEVENT") {
			if (!item) continue;
			const props = item.map(parseProperty).filter(Boolean), pick = (n) => props.find((x) => x.name === n);
			const summary = pick("SUMMARY")?.value || "", kind = classifyEvent(summary);
			const from = pick("DTSTART"), to = pick("DTEND");
			const st = from ? localDateTime(from.value, from.params) : null, en = to ? localDateTime(to.value, to.params) : null;
			if (!kind || !st || !en || st.date !== en.date || timeMinutes(en.time) <= timeMinutes(st.time) || timeMinutes(en.time) - timeMinutes(st.time) > 720) {
				result.skipped++;
				item = null;
				continue;
			}
			const base = {
				id: "ics-" + safe(pick("UID")?.value || kind),
				date: st.date,
				type: kind,
				start: st.time,
				end: en.time,
				title: safe(summary),
				venue: safe(pick("LOCATION")?.value || "")
			};
			const rule = pick("RRULE")?.value;
			if (rule) {
				const fields = Object.fromEntries(rule.split(";").map((x) => x.split("=")));
				if (fields.FREQ !== "WEEKLY") {
					result.skipped++;
					item = null;
					continue;
				}
				const byDays = (fields.BYDAY || days[((/* @__PURE__ */ new Date(st.date + "T12:00:00Z")).getUTCDay() + 6) % 7]).split(",").filter((x) => days.includes(x));
				const count = Math.min(182, Math.max(1, Number(fields.COUNT) || 182));
				const interval = Math.min(8, Math.max(1, Number(fields.INTERVAL) || 1));
				const until = fields.UNTIL ? localDateTime(fields.UNTIL.replace(/^(\d{8})$/, "$1T235959Z"), fields.UNTIL.endsWith("Z") ? "" : "") : null;
				const exceptions = new Set(props.filter((x) => x.name === "EXDATE").flatMap((x) => x.value.split(",")).map((x) => localDateTime(x, from.params)?.date).filter(Boolean));
				let generated = 0;
				for (let offset = 0; offset < 182 && generated < count; offset++) {
					const date = addDays(st.date, offset), day = days[((/* @__PURE__ */ new Date(date + "T12:00:00Z")).getUTCDay() + 6) % 7];
					if (until && date > until.date) break;
					if (Math.floor(offset / 7) % interval !== 0 || !byDays.includes(day) || exceptions.has(date)) continue;
					add({
						...base,
						id: base.id + "-" + date,
						date
					});
					generated++;
				}
				result.recurring++;
			} else add(base);
			item = null;
			continue;
		}
		if (item) item.push(line);
	}
	if (result.imported === 0) throw new Error("No supported school or basketball events found");
	result.weeks = cleanCalendarWeeks(result.weeks);
	result.imported = Object.values(result.weeks).reduce((a, x) => a + x.length, 0);
	return result;
}
//#endregion
//#region src/training/fitness-engine.js
/**
* ZENITH PRO · deterministic, privacy-first training planner.
* The planner does not diagnose, predict performance, prescribe body-weight
* targets, or invent readiness data. It layers recovery and optional conditioning
* around actual team commitments; never treats them as empty training days.
* References: AAP Pediatrics 2024 (overuse prevention), AAP 2020 (resistance
* training), AOSSM 2025 (youth strength), CDC adolescent sleep recommendations.
*/
var FITNESS_DAYS = [
	"mon",
	"tue",
	"wed",
	"thu",
	"fri",
	"sat",
	"sun"
];
var FITNESS_MODES = [
	"free",
	"team",
	"game",
	"light",
	"rest"
];
var FITNESS_GOALS = [
	"wellbeing",
	"court",
	"strength",
	"endurance",
	"mobility"
];
var FITNESS_EQUIPMENT = [
	"none",
	"bands",
	"gym"
];
var FITNESS_LEVELS = ["beginner", "intermediate"];
var isoDate = /^\d{4}-\d{2}-\d{2}$/;
var contains = (arr, value) => arr.includes(value);
var choose = (arr, value, fallback) => contains(arr, value) ? value : fallback;
var clamp = (value, min, max, fallback) => {
	if (value === "" || value == null || !Number.isFinite(Number(value))) return fallback;
	return Math.min(max, Math.max(min, Math.round(Number(value))));
};
function isYouthAthlete(profile) {
	const age = Number(profile?.age);
	return Number.isFinite(age) && age >= 10 && age < 18;
}
function defaultFitnessSettings(profile = {}) {
	const basket = profile.id === "son" || /basketball|μπάσκετ/i.test(String(profile.role || ""));
	return {
		id: "fitness:" + (profile.id || "unknown"),
		memberId: profile.id || "unknown",
		goal: basket ? "court" : "wellbeing",
		sport: basket ? "basketball" : "general",
		experience: "beginner",
		equipment: "none",
		minutes: basket ? 20 : 25,
		strengthSessions: basket ? 1 : 2,
		coachSupervised: false,
		supplementEnabled: true,
		supplementFocus: "balanced",
		supplementmonTime: "17:30",
		supplementwedTime: "19:00",
		supplementfriTime: "06:00",
		supplementmonMinutes: 45,
		supplementwedMinutes: 45,
		supplementfriMinutes: 45,
		calendarWeeks: profile.id === "son" ? defaultDimitrisCalendar() : {},
		calendarSource: profile.id === "son" ? "family-screenshot" : "unconfirmed",
		repeatWeekly: false,
		repeatFromWeek: "2026-11-02",
		schedule: basket ? [
			"team",
			"team",
			"team",
			"team",
			"team",
			"game",
			"rest"
		] : [
			"free",
			"free",
			"free",
			"free",
			"free",
			"light",
			"rest"
		],
		source: "starter-preset"
	};
}
function normalizeFitnessSettings(input = {}, profile = {}) {
	const defaults = defaultFitnessSettings(profile);
	const youth = isYouthAthlete(profile);
	return {
		id: "fitness:" + profile.id,
		memberId: profile.id,
		goal: choose(FITNESS_GOALS, input.goal, defaults.goal),
		sport: choose([
			"basketball",
			"football",
			"running",
			"cycling",
			"general",
			"other"
		], input.sport, defaults.sport),
		experience: choose(FITNESS_LEVELS, input.experience, defaults.experience),
		equipment: choose(FITNESS_EQUIPMENT, input.equipment, defaults.equipment),
		minutes: clamp(input.minutes, 10, youth ? 40 : 60, defaults.minutes),
		strengthSessions: clamp(input.strengthSessions, 0, youth ? 2 : 3, defaults.strengthSessions),
		coachSupervised: input.coachSupervised === true || input.coachSupervised === "on",
		supplementEnabled: input.supplementEnabled !== false,
		supplementFocus: [
			"balanced",
			"strength",
			"speed",
			"stamina",
			"movement",
			"durability"
		].includes(input.supplementFocus) ? input.supplementFocus : defaults.supplementFocus,
		supplementmonTime: /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(input.supplementmonTime || input.supplementMondayTime || "")) ? input.supplementmonTime || input.supplementMondayTime : defaults.supplementmonTime,
		supplementwedTime: /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(input.supplementwedTime || "")) ? input.supplementwedTime : defaults.supplementwedTime,
		supplementfriTime: /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(input.supplementfriTime || "")) ? input.supplementfriTime : defaults.supplementfriTime,
		supplementmonMinutes: clamp(input.supplementmonMinutes, 40, 60, defaults.supplementmonMinutes),
		supplementwedMinutes: clamp(input.supplementwedMinutes, 40, 60, defaults.supplementwedMinutes),
		supplementfriMinutes: clamp(input.supplementfriMinutes, 40, 60, defaults.supplementfriMinutes),
		schedule: FITNESS_DAYS.map((_, i) => choose(FITNESS_MODES, input.schedule?.[i], defaults.schedule[i])),
		calendarWeeks: cleanCalendarWeeks(input.calendarWeeks === void 0 ? defaults.calendarWeeks : input.calendarWeeks),
		calendarSource: typeof input.calendarSource === "string" ? input.calendarSource.slice(0, 36) : defaults.calendarSource,
		repeatWeekly: input.repeatWeekly === true,
		repeatFromWeek: typeof input.repeatFromWeek === "string" ? input.repeatFromWeek : defaults.repeatFromWeek,
		source: input.source === "starter-preset" ? "starter-preset" : "custom",
		updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : null
	};
}
function weekStartOf(dateKey) {
	if (!isoDate.test(String(dateKey))) throw new Error("Invalid date key");
	const d = /* @__PURE__ */ new Date(dateKey + "T12:00:00Z");
	if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== dateKey) throw new Error("Invalid date");
	const weekday = (d.getUTCDay() + 6) % 7;
	d.setUTCDate(d.getUTCDate() - weekday);
	return d.toISOString().slice(0, 10);
}
function shiftDate(dateKey, days) {
	const d = /* @__PURE__ */ new Date(dateKey + "T12:00:00Z");
	if (!isoDate.test(String(dateKey)) || !Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== dateKey) throw new Error("Invalid date");
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}
function fitnessLogId(memberId, dateKey) {
	return "fitness-log:" + memberId + ":" + dateKey;
}
/** Avoid default "ready" scores when the user has supplied no observation. */
function assessReadiness(log, profile) {
	if (log?.pain === true) return {
		level: "stop",
		reason: "pain"
	};
	if (!log || !log.checkedAt) return {
		level: "unknown",
		reason: "unrecorded"
	};
	const sleep = Number(log.sleepHours);
	const energy = Number(log.energy);
	const soreness = Number(log.soreness);
	if (!Number.isFinite(sleep) || !Number.isFinite(energy) || !Number.isFinite(soreness) || sleep < 0 || sleep > 16 || energy < 1 || energy > 5 || soreness < 1 || soreness > 5) return {
		level: "unknown",
		reason: "incomplete"
	};
	const youth = isYouthAthlete(profile);
	if (sleep < (youth ? 7 : 6) || soreness >= 4 || energy <= 2) return {
		level: "recover",
		reason: sleep < (youth ? 7 : 6) ? "sleep" : soreness >= 4 ? "soreness" : "energy"
	};
	if (sleep < (youth ? 8 : 7) || soreness === 3 || energy === 3) return {
		level: "caution",
		reason: "fatigue"
	};
	return {
		level: "normal",
		reason: "reported"
	};
}
var step = (el, en) => ({
	el,
	en
});
var prep = [step("5′ δυναμική προθέρμανση, ήπιες κινήσεις ισχίων/αστραγάλων.", "5 min dynamic warm-up and easy hip/ankle movement."), step("Ρυθμός που επιτρέπει άνετη ομιλία· τεχνική πριν από ένταση.", "Conversational effort; technique before intensity.")];
var restore = [step("Ήπια κινητικότητα 5–8′ ή ανάπαυση αν υπάρχει κόπωση.", "Gentle mobility for 5–8 min, or full rest if tired."), step("Νερό, κανονικά γεύματα και επαρκής ύπνος.", "Fluids, regular meals and adequate sleep.")];
var strengthA = [
	step("5′ ήπια δυναμική προθέρμανση.", "5 min of easy dynamic warm-up."),
	step("Καθίσματα με βάρος σώματος 1–2 × 8, αργή τεχνική.", "Bodyweight squats 1–2 × 8, controlled form."),
	step("Split squat 1–2 × 6 ανά πόδι, με υποστήριξη.", "Supported split squats 1–2 × 6 per leg."),
	step("Push-ups στον τοίχο ή πάγκο 1–2 × 8.", "Wall or incline push-ups 1–2 × 8."),
	step("Dead bug 1–2 × 6 ανά πλευρά, μετά χαλάρωμα.", "Dead bug 1–2 × 6 each side, then cool down.")
];
var strengthB = [
	step("5′ δυναμική προθέρμανση και έλεγχος ισορροπίας.", "5 min dynamic warm-up and balance check."),
	step("Hip hinge χωρίς βάρος 1–2 × 8 με επίβλεψη.", "Unloaded hip hinge 1–2 × 8 with supervision."),
	step("Step-up σε χαμηλό σκαλί 1–2 × 6 ανά πόδι.", "Low step-ups 1–2 × 6 per leg."),
	step("Αργές άρσεις γάμπας 1–2 × 10.", "Controlled calf raises 1–2 × 10."),
	step("Side plank 1–2 × 15–20″ ανά πλευρά· ήπια αποθεραπεία.", "Side plank 1–2 × 15–20 sec each side; easy cool-down.")
];
var courtPrep = [
	step("Κινητικότητα ισχίων/αστραγάλων 2–3′.", "2–3 min hip and ankle mobility."),
	step("Ισορροπία στο ένα πόδι 2 × 20″ ανά πλευρά.", "Single-leg balance 2 × 20 sec each side."),
	step("Ήπια πλάγια βήματα 2 × 20″, χωρίς εξάντληση.", "Easy lateral steps 2 × 20 sec, without fatigue."),
	step("Μετά την ομαδική προπόνηση: χαλάρωμα 3–5′.", "After team practice: 3–5 min easy cool-down.")
];
function selectStrengthDays(schedule, settings, youth) {
	if (settings.strengthSessions <= 0) return [];
	if (youth && !settings.coachSupervised) return [];
	const sportDays = schedule.filter((v) => v === "team" || v === "game").length;
	const restDays = schedule.filter((v) => v === "rest").length;
	if (youth && (sportDays >= 5 || restDays === 0)) return [];
	const max = Math.min(settings.strengthSessions, youth ? 2 : 3);
	const picks = [];
	const candidates = FITNESS_DAYS.map((_, i) => i).filter((i) => schedule[i] === "free");
	for (const day of candidates) {
		const prev = (day + 6) % 7;
		const next = (day + 1) % 7;
		if (schedule[day] === "game" || schedule[prev] === "game" || schedule[next] === "game") continue;
		if (picks.some((p) => Math.abs(day - p) <= 1 || Math.abs(day - p) >= 6)) continue;
		picks.push(day);
		if (picks.length >= max) break;
	}
	return picks;
}
function sessionForMode(mode, strength, goal, settings, youth, index) {
	if (mode === "rest") return {
		kind: "rest",
		duration: 0,
		steps: restore
	};
	if (mode === "game") return {
		kind: "game",
		duration: 0,
		steps: [
			step("Ομαδικός αγώνας: ακολούθησε την προθέρμανση του προπονητή.", "Game day: follow your coach’s warm-up."),
			step("Μην προσθέτεις έντονη ενδυνάμωση ή σπριντ μετά τον αγώνα.", "Do not add hard strength or sprints after the game."),
			...restore
		]
	};
	if (mode === "team") return {
		kind: "team",
		duration: 0,
		steps: [step("Η ομαδική προπόνηση είναι ο κύριος φόρτος. Επιπλέον ενδυνάμωση: 0′.", "Team practice is the main load. Extra strength: 0 minutes."), step("Ακολούθησε την προθέρμανση και τις οδηγίες του προπονητή· μην προσθέτεις σπριντ.", "Follow the coach’s warm-up and instructions; do not add sprints.")]
	};
	if (mode === "light") return {
		kind: "recovery",
		duration: 10,
		steps: restore
	};
	if (strength) {
		const strengthSteps = index % 2 === 0 ? strengthA : strengthB;
		const equipmentTip = settings.equipment === "bands" ? step("Ελαφριές έλξεις με λάστιχο 1–2 × 8, χωρίς πόνο και χωρίς εξάντληση.", "Easy band rows 1–2 × 8, pain-free, without fatigue.") : settings.equipment === "gym" ? step("Χρησιμοποίησε εξοπλισμό μόνο με έλεγχο τεχνικής από προπονητή· όχι μέγιστες προσπάθειες.", "Use gym equipment only after technique review by a coach; no maximal efforts.") : step("Δεν απαιτείται εξοπλισμός· σταμάτα αν χαθεί η τεχνική.", "No equipment is required; stop when technique deteriorates.");
		const experienceTip = settings.experience === "beginner" ? step("Ξεκίνα με 1 σετ και μάθε την κίνηση με επίβλεψη.", "Start with 1 set and learn the movement under supervision.") : step("Έως 2 ήπια σετ μόνο αν η τεχνική παραμένει σωστή.", "Up to 2 easy sets only while technique stays controlled.");
		return {
			kind: "strength",
			duration: Math.min(settings.minutes, youth ? 25 : 35),
			steps: [
				...strengthSteps,
				equipmentTip,
				experienceTip
			]
		};
	}
	if (goal === "endurance" && !youth) return {
		kind: "easy",
		duration: settings.minutes,
		steps: prep
	};
	if (goal === "court") return youth ? {
		kind: "rest",
		duration: 0,
		steps: restore
	} : {
		kind: "skills",
		duration: Math.min(settings.minutes, 25),
		steps: courtPrep
	};
	return {
		kind: "mobility",
		duration: Math.min(settings.minutes, youth ? 15 : 25),
		steps: restore
	};
}
function adjustSession(session, readiness) {
	if (readiness.level === "stop") return {
		...session,
		kind: "stop",
		duration: 0,
		steps: [step("Διακοπή προπόνησης λόγω αναφερόμενου πόνου.", "Stop training because pain was reported."), step("Ενημέρωσε γονέα/προπονητή και αναζήτησε αξιολόγηση από επαγγελματία υγείας.", "Tell a parent/coach and seek qualified medical assessment.")]
	};
	if (readiness.level === "recover" || readiness.level === "caution" && session.kind === "strength") return {
		...session,
		kind: "recovery",
		duration: 8,
		steps: restore
	};
	return session;
}
/**
* Build the week from actual dated calendar events where available.
* For Dimitris, an unknown future week never inherits screenshot fixture
* commitments or produces imaginary extra workouts.
*/
function buildFitnessWeek(profile, savedSettings, logs = [], anchorDate) {
	const settings = normalizeFitnessSettings(savedSettings || defaultFitnessSettings(profile), profile);
	const start = weekStartOf(anchorDate);
	const youth = isYouthAthlete(profile);
	const athleteCalendar = profile.id === "son" && settings.sport === "basketball";
	const resolved = athleteCalendar ? resolveCalendarWeek(settings, start) : {
		known: false,
		events: [],
		source: "manual",
		repeated: false
	};
	const calendarKnown = athleteCalendar && resolved.known;
	const calendarMissing = athleteCalendar && !resolved.known;
	const calendarStats = summarizeCalendarEvents(resolved.events);
	const modes = calendarKnown ? FITNESS_DAYS.map((_, i) => {
		const date = shiftDate(start, i);
		const events = resolved.events.filter((e) => e.date === date);
		if (events.some((e) => e.type === "game")) return "game";
		if (events.some((e) => e.type === "team")) return "team";
		return "rest";
	}) : calendarMissing ? FITNESS_DAYS.map(() => "unconfirmed") : settings.schedule;
	const sportDays = calendarKnown ? calendarStats.teamDays : modes.filter((v) => v === "team" || v === "game").length;
	const restDays = modes.filter((v) => v === "rest").length;
	const highYouthLoad = youth && (sportDays >= 5 || calendarKnown && (calendarStats.teamMinutes >= 600 || calendarStats.lateNights >= 2));
	const selected = calendarMissing || highYouthLoad ? [] : selectStrengthDays(modes, settings, youth);
	const warnings = [];
	if (calendarMissing) warnings.push("calendar-unconfirmed");
	if (calendarKnown && resolved.repeated) warnings.push("calendar-repeated");
	if (youth && !calendarMissing && restDays < 1) warnings.push("no-rest");
	if (youth && !calendarMissing && restDays === 1) warnings.push("one-rest");
	if (youth && sportDays >= 5) warnings.push("high-team-load");
	if (youth && calendarStats.lateNights >= 2) warnings.push("late-finishes");
	if (youth && calendarStats.teamMinutes >= 600) warnings.push("high-hours");
	if (youth && settings.strengthSessions > 0 && !settings.coachSupervised && !highYouthLoad && !calendarMissing) warnings.push("supervision");
	if (youth && sportDays >= 5 && settings.goal === "court") warnings.push("avoid-stacking");
	if (resolved.events.some((e) => isTentativeEvent(e))) warnings.push("match-unconfirmed");
	const days = FITNESS_DAYS.map((dayKey, i) => {
		const date = shiftDate(start, i), events = resolved.events.filter((e) => e.date === date);
		const log = logs.find((l) => l?.memberId === profile.id && l?.date === date) || null;
		const readiness = assessReadiness(log, profile);
		let session = adjustSession(calendarMissing ? {
			kind: "unconfirmed",
			duration: 0,
			steps: [step("Δεν έχει επιβεβαιωθεί πρόγραμμα ομάδας για αυτή την εβδομάδα. Εισήγαγε ημερολόγιο ή ενημέρωσε τις ώρες.", "No team schedule is confirmed for this week. Import or update the calendar.")]
		} : sessionForMode(modes[i], selected.includes(i), settings.goal, settings, youth, i), readiness);
		const sportMinutes = events.filter((x) => (x.type === "team" || x.type === "game") && !isTentativeEvent(x)).reduce((sum, x) => sum + eventDuration(x), 0);
		const schoolMinutes = events.filter((x) => x.type === "school").reduce((sum, x) => sum + eventDuration(x), 0);
		if (calendarKnown && sportMinutes > 0) session = {
			...session,
			duration: 0
		};
		if (youth && session.kind === "strength" && readiness.level !== "normal") session = {
			...session,
			kind: "recovery",
			duration: 0,
			steps: restore
		};
		return {
			...session,
			dayKey,
			date,
			mode: modes[i],
			events,
			sportMinutes,
			schoolMinutes,
			extraMinutes: Math.max(0, session.duration || 0),
			readiness,
			done: !!log?.done,
			sleepHours: log?.sleepHours ?? null,
			energy: log?.energy ?? null,
			soreness: log?.soreness ?? null,
			pain: log?.pain === true
		};
	});
	const extraMinutes = days.reduce((sum, x) => sum + x.extraMinutes, 0);
	const scheduledBasketballMinutes = calendarKnown ? calendarStats.teamMinutes : null;
	return {
		settings,
		days,
		weekStart: start,
		youth,
		restDays,
		sportDays,
		strengthDays: days.reduce((a, d, i) => d.kind === "strength" ? a.concat(i) : a, []),
		warnings,
		calendar: resolved,
		calendarStats,
		calendarKnown,
		calendarMissing,
		extraMinutes,
		scheduledBasketballMinutes,
		highYouthLoad
	};
}
//#endregion
//#region src/training/store.ts
var EMPTY_TRAINING = Object.freeze({});
function saveTrainingSettings(id, patch, profile) {
	setState((s) => ({
		...s,
		trainingSettings: {
			...s.trainingSettings,
			[id]: {
				...defaultFitnessSettings(profile),
				...s.trainingSettings?.[id],
				...patch
			}
		}
	}));
}
function saveTrainingLog(id, patch) {
	setState((s) => ({
		...s,
		trainingLogs: {
			...s.trainingLogs,
			[id]: {
				...s.trainingLogs?.[id],
				...patch
			}
		}
	}));
}
//#endregion
//#region src/components/training/TrainingForms.tsx
function ReadinessForm({ profile, date, log }) {
	const { t, pick, language } = useI18n();
	const [sleep, setSleep] = useState(log?.sleepHours ?? "");
	const [energy, setEnergy] = useState(log?.energy ?? "");
	const [soreness, setSoreness] = useState(log?.soreness ?? "");
	const [pain, setPain] = useState(log?.pain ?? false);
	return /* @__PURE__ */ jsxs("form", {
		className: "space-y-4",
		onSubmit: (e) => {
			e.preventDefault();
			saveTrainingLog(fitnessLogId(profile.id, date), {
				memberId: profile.id,
				date,
				sleepHours: Number(sleep),
				energy: Number(energy),
				soreness: Number(soreness),
				pain,
				checkedAt: (/* @__PURE__ */ new Date()).toISOString()
			});
			toast.success(t("Ο σημερινός έλεγχος αποθηκεύτηκε"));
		},
		children: [
			/* @__PURE__ */ jsxs("label", {
				className: "block text-sm",
				children: [t("Πραγματικός ύπνος (ώρες)"), /* @__PURE__ */ jsx(Input, {
					type: "number",
					step: "0.5",
					min: "0",
					max: "16",
					required: true,
					value: sleep,
					onChange: (e) => setSleep(e.target.value),
					className: "mt-1",
					placeholder: t("π.χ. 8,5")
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ jsxs("label", {
					className: "text-sm",
					children: [t("Ενέργεια"), /* @__PURE__ */ jsxs("select", {
						required: true,
						className: "mt-1 h-10 w-full rounded-md border bg-background px-2",
						value: energy,
						onChange: (e) => setEnergy(e.target.value),
						children: [/* @__PURE__ */ jsx("option", {
							value: "",
							children: t("Επίλεξε")
						}), [
							t("Πολύ χαμηλή"),
							t("Χαμηλή"),
							t("Μέτρια"),
							t("Καλή"),
							t("Πολύ καλή")
						].map((x, i) => /* @__PURE__ */ jsxs("option", {
							value: i + 1,
							children: [
								i + 1,
								" · ",
								x
							]
						}, x))]
					})]
				}), /* @__PURE__ */ jsxs("label", {
					className: "text-sm",
					children: [t("Μυϊκό πιάσιμο"), /* @__PURE__ */ jsxs("select", {
						required: true,
						className: "mt-1 h-10 w-full rounded-md border bg-background px-2",
						value: soreness,
						onChange: (e) => setSoreness(e.target.value),
						children: [/* @__PURE__ */ jsx("option", {
							value: "",
							children: t("Επίλεξε")
						}), [
							t("Καθόλου"),
							t("Λίγο"),
							t("Μέτριο"),
							t("Έντονο"),
							t("Πολύ έντονο")
						].map((x, i) => /* @__PURE__ */ jsxs("option", {
							value: i + 1,
							children: [
								i + 1,
								" · ",
								x
							]
						}, x))]
					})]
				})]
			}),
			/* @__PURE__ */ jsxs("label", {
				className: "flex items-center gap-2 text-sm",
				children: [
					/* @__PURE__ */ jsx("input", {
						type: "checkbox",
						checked: pain,
						onChange: (e) => setPain(e.target.checked)
					}),
					" ",
					t("Έχω πόνο ή αδιαθεσία")
				]
			}),
			/* @__PURE__ */ jsxs(Button, {
				type: "submit",
				className: "w-full",
				children: [
					/* @__PURE__ */ jsx(Check, {}),
					" ",
					t("Αποθήκευση ελέγχου")
				]
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "text-xs leading-relaxed text-muted-foreground",
				children: [
					pick("Ειλικρινής καταγραφή, όχι βαθμολογία υγείας. Οι απαντήσεις δεν αντικαθιστούν επαγγελματική αξιολόγηση.", "Honest reporting, not a health score. Answers do not replace professional assessment."),
					" ",
					profile.age < 18 ? pick("Έφηβοι: 8–10 ώρες ύπνου.", "Teens: 8–10 hours of sleep.") : pick("Ενήλικες: τουλάχιστον 7 ώρες ύπνου.", "Adults: at least 7 hours of sleep.")
				]
			})
		]
	});
}
var DAYS$1 = [
	"Δευτέρα",
	"Τρίτη",
	"Τετάρτη",
	"Πέμπτη",
	"Παρασκευή",
	"Σάββατο",
	"Κυριακή"
];
function CalendarEditor({ profile, start, settings, events }) {
	const { t, pick, language } = useI18n();
	const [draft, setDraft] = useState(events.map((e) => ({ ...e })));
	const [day, setDay] = useState(0);
	const [type, setType] = useState("team");
	const [from, setFrom] = useState("18:00");
	const [to, setTo] = useState("19:30");
	return /* @__PURE__ */ jsxs("details", {
		className: "border-y py-5",
		children: [/* @__PURE__ */ jsx("summary", {
			className: "font-semibold",
			children: t("Πρόγραμμα ομάδας & σχολείου · επεξεργασία")
		}), /* @__PURE__ */ jsxs("div", {
			className: "mt-4 space-y-4",
			children: [
				/* @__PURE__ */ jsxs("p", {
					className: "text-sm text-muted-foreground",
					children: [
						t("Εβδομάδα"),
						start,
						t(". Κατάγραψε όλες τις υποχρεώσεις και επιβεβαίωσε ότι οι κενές ημέρες είναι πράγματι ελεύθερες. Η παλιά εβδομάδα δεν επαναλαμβάνεται αυτόματα.")
					]
				}),
				draft.map((e, i) => /* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between gap-2 border-b py-2 text-sm",
					children: [/* @__PURE__ */ jsxs("span", { children: [
						e.date,
						" · ",
						e.type === "school" ? t("Σχολείο") : e.type === "game" ? t("Αγώνας") : t("Ομάδα"),
						" ",
						e.start,
						"–",
						e.end,
						e.note ? t(" · μη επιβεβαιωμένο") : ""
					] }), /* @__PURE__ */ jsx(Button, {
						type: "button",
						variant: "ghost",
						size: "icon",
						"aria-label": t(`Διαγραφή ${e.date} ${e.start}`),
						onClick: () => setDraft((x) => x.filter((_, j) => i !== j)),
						children: /* @__PURE__ */ jsx(Trash2, {})
					})]
				}, e.id)),
				/* @__PURE__ */ jsxs("form", {
					className: "grid gap-3 sm:grid-cols-5",
					onSubmit: (e) => {
						e.preventDefault();
						if (to <= from) {
							toast.error(t("Η λήξη πρέπει να είναι μετά την αρχή"));
							return;
						}
						setDraft((x) => [...x, {
							id: `manual-${Date.now()}`,
							date: shiftDate(start, day),
							type,
							start: from,
							end: to,
							title: type === "school" ? t("Σχολείο") : t("Μπάσκετ"),
							venue: "",
							note: ""
						}]);
					},
					children: [
						/* @__PURE__ */ jsxs("label", {
							className: "text-xs",
							children: [t("Ημέρα"), /* @__PURE__ */ jsx("select", {
								className: "mt-1 h-10 w-full rounded-md border bg-background px-2",
								value: day,
								onChange: (e) => setDay(Number(e.target.value)),
								children: DAYS$1.map((x, i) => /* @__PURE__ */ jsx("option", {
									value: i,
									children: x
								}, x))
							})]
						}),
						/* @__PURE__ */ jsxs("label", {
							className: "text-xs",
							children: [t("Υποχρέωση"), /* @__PURE__ */ jsxs("select", {
								className: "mt-1 h-10 w-full rounded-md border bg-background px-2",
								value: type,
								onChange: (e) => setType(e.target.value),
								children: [
									/* @__PURE__ */ jsx("option", {
										value: "team",
										children: t("Ομάδα")
									}),
									/* @__PURE__ */ jsx("option", {
										value: "game",
										children: t("Αγώνας")
									}),
									/* @__PURE__ */ jsx("option", {
										value: "school",
										children: t("Σχολείο")
									})
								]
							})]
						}),
						/* @__PURE__ */ jsxs("label", {
							className: "text-xs",
							children: [t("Αρχή"), /* @__PURE__ */ jsx(Input, {
								required: true,
								type: "time",
								value: from,
								onChange: (e) => setFrom(e.target.value),
								className: "mt-1"
							})]
						}),
						/* @__PURE__ */ jsxs("label", {
							className: "text-xs",
							children: [t("Τέλος"), /* @__PURE__ */ jsx(Input, {
								required: true,
								type: "time",
								value: to,
								onChange: (e) => setTo(e.target.value),
								className: "mt-1"
							})]
						}),
						/* @__PURE__ */ jsxs(Button, {
							type: "submit",
							variant: "outline",
							className: "self-end",
							children: [
								/* @__PURE__ */ jsx(Plus, {}),
								" ",
								t("Προσθήκη")
							]
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-3",
					children: [/* @__PURE__ */ jsxs(Button, {
						onClick: () => {
							saveTrainingSettings(profile.id, {
								calendarWeeks: {
									...settings.calendarWeeks,
									[start]: cleanCalendarEvents(draft, start)
								},
								calendarSource: "manual",
								repeatWeekly: false
							}, profile);
							toast.success(t("Το πρόγραμμα της εβδομάδας επιβεβαιώθηκε"));
						},
						children: [
							/* @__PURE__ */ jsx(Save, {}),
							" ",
							t("Επιβεβαίωση εβδομάδας")
						]
					}), /* @__PURE__ */ jsxs("label", {
						className: "inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm",
						children: [
							/* @__PURE__ */ jsx(Upload, { className: "size-4" }),
							" ",
							t("Εισαγωγή ημερολογίου .ics"),
							/* @__PURE__ */ jsx("input", {
								type: "file",
								accept: ".ics,text/calendar",
								className: "sr-only",
								onChange: async (e) => {
									const file = e.target.files?.[0];
									if (!file) return;
									try {
										const imported = parseFitnessIcs(await file.text());
										saveTrainingSettings(profile.id, {
											calendarWeeks: {
												...settings.calendarWeeks,
												...imported.weeks
											},
											calendarSource: "ics",
											repeatWeekly: false
										}, profile);
										toast.success(t(`${imported.imported} υποχρεώσεις εισήχθησαν`));
									} catch {
										toast.error(t("Δεν βρέθηκαν υποστηριζόμενες υποχρεώσεις σχολείου ή μπάσκετ"));
									}
								}
							})
						]
					})]
				})
			]
		})]
	});
}
//#endregion
//#region src/training/exercise-library.js
/**
* ZENITH PRO · curated technique library for 15-year-old basketball athlete.
* Video metadata (title/channel/availability) checked on 2026-11-15; some
* educational links are to longer demonstrations with relevant timestamps. An example video is for MOVEMENT TECHNIQUE, not a prescription
* for exercise intensity, loads, repetitions or injury treatment.
*
* NO autoplay, third-party scripts, YouTube API or embedded tracking.
* Only user-initiated, noreferrer YouTube links are exposed by the view.
*/
var v = (id, channel, topic, start = 0) => Object.freeze({
	url: "https://www.youtube.com/watch?v=" + id + (start ? "&t=" + start + "s" : ""),
	channel,
	topic,
	reviewedAt: "2026-11-15",
	verification: "metadata-only"
});
var TECHNIQUE_VIDEOS = Object.freeze({
	hip: v("fPaF3oro6hE", "E3 Rehab", "Hip mobility and controlled range", 314),
	ankle: v("S5xKokqeOb4", "E3 Rehab", "Foot and ankle mobility and control", 783),
	squat: v("yzL1543i1-o", "E3 Rehab Exercise Library", "Bodyweight squat"),
	split: v("4bNQITw0VdY", "E3 Rehab", "Supported split-squat technique", 69),
	hinge: v("oSfNnSJWlMw", "E3 Rehab Exercise Library", "Unloaded hip hinge"),
	push: v("3H3R9RU3PRk", "E3 Rehab", "Push-up progressions including easier options"),
	row: v("RrcocPwM_-U", "C.E.S Physio & Rehab", "Resistance band rowing"),
	deadbug: v("BZYaCzbP09M", "E3 Rehab Exercise Library", "Dead bug"),
	sideplank: v("eRygfYEe1hs", "E3 Rehab Exercise Library", "Side plank"),
	calf: v("zvZp4FJjME4", "E3 Rehab Exercise Library", "Heel raises"),
	balance: v("nLHy38nxMmY", "E3 Rehab Exercise Library", "Single leg balance"),
	stepup: v("wfhXnLILqdk", "Cornerstone Physiotherapy", "Low step-up technique"),
	march: v("hsO_dSeRBFY", "Jr. NBA / Jr. WNBA", "Forward/backward/lateral marching"),
	breathe: v("UB3tSaiEbNY", "Michigan Medicine", "Diaphragmatic breathing demonstration")
});
var copy$1 = (el, en) => Object.freeze({
	el,
	en
});
var exercise = (title, dose, cue, avoid, easier, equipment, goal, video) => Object.freeze({
	title: copy$1(...title),
	dose: copy$1(...dose),
	cue: copy$1(...cue),
	avoid: copy$1(...avoid),
	easier: copy$1(...easier),
	equipment: copy$1(...equipment),
	goal: copy$1(...goal),
	video: video ? TECHNIQUE_VIDEOS[video] : null
});
var EXERCISE_LIBRARY = Object.freeze({
	"hip-mobility": exercise(["Κινητικότητα ισχίων", "Controlled hip mobility"], ["2–3 ήπιες κινήσεις × 5/πλευρά · μέσα στο διαθέσιμο εύρος", "2–3 easy movements × 5/side · comfortable range"], ["Αργός ρυθμός, σταθερή λεκάνη και ομαλή αναπνοή.", "Move slowly; keep the pelvis controlled and breathe normally."], ["Όχι πίεση στο τελικό εύρος ή πόνο.", "Never force range or work through pain."], ["Μικρότερο εύρος, στήριξη σε τοίχο.", "Reduce range or use wall support."], ["Στρωματάκι προαιρετικά", "Optional mat"], ["Προετοιμασία ισχίων πριν από τεχνική δύναμης", "Prepare hips before strength technique"], "hip"),
	"ankle-mobility": exercise(["Ήπια κινητοποίηση αστραγάλου", "Gentle ankle mobility"], ["2 × 6 αργές μεταφορές γονάτου προς τοίχο/πόδι", "2 × 6 slow knee-over-foot movements"], ["Η φτέρνα παραμένει κάτω, το γόνατο ακολουθεί τα δάχτυλα.", "Keep heel down; let knee track over toes."], ["Μην ξεκολλάς τη φτέρνα ή πιέζεις σε πόνο.", "Do not lift heel or force a painful stretch."], ["Στάσου πιο κοντά στον τοίχο και μείωσε εύρος.", "Stand closer to the wall; decrease range."], ["Τοίχος προαιρετικά", "Optional wall"], ["Έλεγχος ποδοκνημικής και προετοιμασία προσγείωσης", "Ankle control for safe basketball movement"], "ankle"),
	squat: exercise(["Κάθισμα με το βάρος του σώματος", "Bodyweight squat"], ["2 × 8 · 45–60″ διάλειμμα · 2″ κάθοδος", "2 × 8 · 45–60s rest · 2s lowering"], ["Πέλματα κάτω, γόνατα στην κατεύθυνση των δαχτύλων, άνετο βάθος.", "Feet planted, knees track over toes, comfortable depth."], ["Όχι βιαστική κάθοδος, ανασήκωμα φτέρνας ή πόνος.", "Avoid collapsing, raised heels or pain."], ["Κάθισμα προς καρέκλα με έλεγχο.", "Sit-to-stand from a stable chair."], ["Καρέκλα προαιρετικά", "Optional chair"], ["Βασικό μοτίβο δύναμης κάτω άκρων", "Foundational lower-body strength pattern"], "squat"),
	split: exercise(["Split squat με στήριξη", "Supported split squat"], ["2 × 6 ανά πόδι · 60″ διάλειμμα", "2 × 6 each leg · 60s rest"], ["Σταθερό βήμα εμπρός/πίσω, και τα δύο πόδια ακίνητα, ελεγχόμενη κάθοδος.", "Staggered stance, both feet stay planted, lower with control."], ["Μην πέφτεις απότομα ή χάνεις την ισορροπία.", "Do not drop or lose balance."], ["Πιάσου σε σταθερό πάγκο· μικρότερο βάθος.", "Use stable support and reduce depth."], ["Σταθερό στήριγμα", "Stable support"], ["Μονόπλευρος έλεγχος για αλλαγές κατεύθυνσης", "Single-leg control for basketball movement"], "split"),
	hinge: exercise(["Hip hinge χωρίς φορτίο", "Unloaded hip hinge"], ["2 × 8 αργές επαναλήψεις · 45″ ανάπαυση", "2 × 8 slow reps · 45s rest"], ["Στείλε τη λεκάνη πίσω, λύγισε λίγο τα γόνατα και κράτα φυσικές καμπύλες.", "Push hips backward, soften knees, maintain natural spine shape."], ["Μην καμπουριάζεις ή μετατρέπεις την κίνηση σε βαθύ κάθισμα.", "Do not round excessively or turn it into a deep squat."], ["Εξάσκηση μπροστά σε τοίχο χωρίς φορτίο.", "Practice wall-touch hip hinge without load."], ["Χωρίς εξοπλισμό", "None"], ["Βάση οπίσθιας αλυσίδας χωρίς βαριά βάρη", "Posterior chain pattern without heavy loading"], "hinge"),
	push: exercise(["Push-up σε σταθερό πάγκο", "Hands-elevated push-up"], ["2 × 6–8 · 45–60″ διάλειμμα", "2 × 6–8 · 45–60s rest"], ["Χέρια σε σταθερή υπερυψωμένη επιφάνεια, κορμός ενιαίος και αργός ρυθμός.", "Hands on stable raised surface; keep trunk aligned and move slowly."], ["Μην αφήνεις τη λεκάνη να πέφτει ή τους αγκώνες να ανοίγουν υπερβολικά.", "Avoid sagging hips or excessive elbow flare."], ["Μεγαλύτερο ύψος χεριών ή push-up στον τοίχο.", "Use higher hand support or wall push-ups."], ["Σταθερός πάγκος ή τοίχος", "Stable bench or wall"], ["Ασφαλής βασική ώθηση του άνω σώματος", "Basic upper-body pushing strength"], "push"),
	row: exercise(["Κωπηλατική με ελαφρύ λάστιχο", "Light resistance-band row"], ["2 × 8 · 45–60″ διάλειμμα", "2 × 8 · 45–60s rest"], ["Το λάστιχο αγκυρωμένο με ασφάλεια, τράβηξε αγκώνες πίσω χωρίς ανασήκωμα ώμων.", "Anchor band securely, draw elbows back without shrugging."], ["Όχι απότομο τίναγμα, χαλαρή αγκύρωση ή υπερέκταση.", "No jerks, loose band anchoring or over-leaning."], ["Ελαφρύτερο λάστιχο ή κίνηση χωρίς αντίσταση.", "Use lighter band or practice without resistance."], ["Λάστιχο και ασφαλής αγκύρωση", "Band and secure anchor"], ["Ισορροπία έλξεων/ωθήσεων, έλεγχος ωμοπλάτης", "Balanced pulling and shoulder control"], "row"),
	deadbug: exercise(["Dead bug · έλεγχος κορμού", "Dead bug · trunk control"], ["2 × 6 ανά πλευρά · αργά", "2 × 6 per side · slow"], ["Εναλλαγή αντίθετου χεριού/ποδιού με σταθερό κορμό και φυσιολογική αναπνοή.", "Alternate opposite arm and leg while keeping trunk controlled and breathing."], ["Μην αυξάνεις εύρος αν χάνεται η θέση κορμού ή κρατάς την αναπνοή.", "Do not reach farther if trunk position or breathing is lost."], ["Μετακίνησε μόνο ένα πόδι κάθε φορά.", "Move one leg at a time."], ["Στρωματάκι", "Mat"], ["Σταθερότητα κορμού και συντονισμός", "Core control and coordination"], "deadbug"),
	sideplank: exercise(["Πλάγια σανίδα", "Side plank"], ["2 × 15–20″ ανά πλευρά · πλήρης ανάπαυση", "2 × 15–20s per side · ample rest"], ["Αγκώνας κάτω από ώμο, ισχία σε ευθεία με κορμό, χωρίς πόνο.", "Elbow beneath shoulder, hips aligned, pain-free hold."], ["Μην αφήνεις τον ώμο να βυθιστεί ή κρατάς την αναπνοή.", "Avoid sinking shoulder or breath-holding."], ["Λυγισμένα γόνατα στο πάτωμα.", "Keep knees bent and supported."], ["Στρωματάκι", "Mat"], ["Πλευρική σταθερότητα κορμού", "Lateral trunk stability"], "sideplank"),
	balance: exercise(["Ισορροπία στο ένα πόδι", "Single-leg balance"], ["2 × 20″ ανά πλευρά · στήριξη δίπλα σου", "2 × 20s each leg · support nearby"], ["Μαλακό γόνατο, ευθεία λεκάνη, σταθερό βλέμμα.", "Soft knee, level pelvis, fixed gaze."], ["Μη στέκεσαι σε ασταθές σημείο ούτε με κλειστά μάτια.", "Do not use unstable surfaces or close eyes."], ["Άκρες δαχτύλων σε τοίχο.", "Fingertip wall support."], ["Τοίχος/καρέκλα για ασφάλεια", "Wall/chair support"], ["Ιδιοδεκτικότητα ποδοκνημικής", "Ankle proprioception"], "balance"),
	calf: exercise(["Αργές άρσεις γάμπας", "Controlled calf raises"], ["2 × 10 · 2″ άνοδος / 2″ κάθοδος", "2 × 10 · 2s up / 2s down"], ["Βάρος και στα δύο πόδια, ήπια στήριξη σε καρέκλα, χωρίς αναπήδηση.", "Even weight, chair support, no bouncing."], ["Μην αφήνεις τους αστραγάλους να γέρνουν πλάγια.", "Avoid ankles rolling out or in."], ["Μικρότερη άνοδος με σταθερή στήριξη.", "Use smaller rise with steady support."], ["Σταθερή καρέκλα", "Stable chair"], ["Γάμπες και σταθερότητα ποδοκνημικής", "Calf control and ankle stability"], "calf"),
	stepup: exercise(["Step-up σε χαμηλό σταθερό σκαλί", "Controlled low step-up"], ["2 × 5 ανά πόδι · 45″ ανάπαυση", "2 × 5 each leg · 45s rest"], ["Όλο το πέλμα στο σκαλί, αργή άνοδος/κάθοδος, σταθερό γόνατο.", "Whole foot on step, slow ascent/descent and steady knee."], ["Όχι ψηλό σκαλί ή απότομη ώθηση από το πίσω πόδι.", "Avoid high step or pushing forcefully with trailing leg."], ["Χαμηλότερο σκαλί και κουπαστή.", "Use shorter step and handrail."], ["Χαμηλό σκαλί και κουπαστή", "Low step and rail"], ["Έλεγχος μονόπλευρης φόρτισης", "Unilateral control"], "stepup"),
	march: exercise(["Marching τεχνικής μπάσκετ", "Basketball movement marching"], ["3 × 20″ αργά · 50–60″ διάλειμμα", "3 × 20s slow · 50–60s recovery"], ["Ήρεμη εναλλαγή ποδιών, κορμός ψηλά, αντίθετο χέρι/γόνατο.", "Slow alternate steps, tall posture, opposite arm and knee."], ["Όχι σπριντ, άλματα ή γρήγορες επαφές στο έδαφος.", "No sprints, hops or fast ground contacts."], ["March επί τόπου κοντά σε τοίχο.", "March in place near a wall."], ["Χωρίς εξοπλισμό", "None"], ["Μηχανική κίνησης χωρίς νέο εξαντλητικό φορτίο", "Movement mechanics without conditioning fatigue"], "march"),
	breathing: exercise(["Ήρεμη διαφραγματική αναπνοή", "Gentle diaphragmatic breathing"], ["2–4 λεπτά άνετα · χωρίς κράτημα αναπνοής", "2–4 minutes comfortably · no breath-holds"], ["Χαλάρωσε τους ώμους, ανάπνευσε ήσυχα και φυσικά.", "Relax shoulders and breathe slowly and comfortably."], ["Όχι αναγκαστικά βαθιά αναπνοή, ζάλη ή υπεραερισμός.", "Avoid forced deep breaths or dizziness."], ["Κανονική ήρεμη αναπνοή.", "Just breathe normally."], ["Χωρίς εξοπλισμό", "None"], ["Μετάβαση σε ξεκούραση", "Transition to rest"], "breathe"),
	walk: exercise(["Χαλαρό περπάτημα", "Easy walking"], ["Άνετη ένταση συνομιλίας, χωρίς τρέξιμο", "Comfortable talking pace, no running"], ["Ίσια χαλαρή στάση και ομαλή αναπνοή.", "Relaxed tall posture and comfortable breathing."], ["Όχι διαλειμματική ένταση ή προπόνηση αντοχής.", "Not intervals or endurance conditioning."], ["Πλήρης ανάπαυση όταν υπάρχει κόπωση.", "Full rest if fatigued."], ["Ασφαλής επίπεδη διαδρομή", "Safe level surface"], ["Πολύ χαμηλής έντασης αποκατάσταση", "Very low-intensity recovery"], null)
});
function exerciseFor(id) {
	return EXERCISE_LIBRARY[id] || null;
}
function isSafeYouTubeWatchUrl(url) {
	if (typeof url !== "string") return false;
	try {
		const u = new URL(url);
		return u.protocol === "https:" && u.hostname === "www.youtube.com" && u.pathname === "/watch" && /^[A-Za-z0-9_-]{11}$/.test(u.searchParams.get("v") || "");
	} catch {
		return false;
	}
}
//#endregion
//#region src/training/evidence.ts
var TRAINING_EVIDENCE = [
	{
		name: "AAP · Ενδυνάμωση παιδιών και εφήβων (2020, επιβεβαίωση 2024)",
		url: "https://publications.aap.org/pediatrics/article/145/6/e20201011/76942",
		claim: "Επίβλεψη, εκμάθηση τεχνικής και σταδιακή πρόοδος. Η δόση χρειάζεται προσαρμογή από εξειδικευμένο προπονητή.",
		checked: "Περιεχόμενο μέσω ευρετηρίου εκδότη · 15/11/2026"
	},
	{
		name: "AAP · Υπέρχρηση, υπερπροπόνηση και εξουθένωση (2024)",
		url: "https://publications.aap.org/pediatrics/article/153/2/e2023065129/196435/Overuse-Injuries-Overtraining-and-Burnout-in-Young",
		claim: "Ο συνολικός φόρτος ομάδας και ατομικής προπόνησης χρειάζεται επαρκή αποκατάσταση και ημέρες ανάπαυσης.",
		checked: "Περιεχόμενο μέσω ευρετηρίου εκδότη · 15/11/2026"
	},
	{
		name: "CDC · Ύπνος εφήβων",
		url: "https://www.cdc.gov/sleep/about/index.html",
		claim: "Για ηλικίες 13–17: 8–10 ώρες ύπνου ανά 24ωρο. Το χρονικό διάστημα μεταξύ υποχρεώσεων δεν ισούται με πραγματικό ύπνο.",
		checked: "Άμεση ανάγνωση πηγής · 15/11/2026"
	},
	{
		name: "Διεθνής συναίνεση · Youth resistance training (2014)",
		url: "https://bjsm.bmj.com/content/48/7/498",
		claim: "Εκπαίδευση από καταρτισμένο επαγγελματία, σωστή τεχνική και ατομική προσαρμογή πριν αυξηθεί το φορτίο.",
		checked: "Ταυτότητα δημοσίευσης επιβεβαιωμένη · πλήρες κείμενο όχι ανεξάρτητα επανελεγμένο"
	}
];
var REASONS = {
	"missing-check-in": "Χρειάζεται σημερινός έλεγχος ύπνου, ενέργειας και πόνου.",
	"coach-required": "Η ενδυνάμωση χρειάζεται παρόντα, καταρτισμένο προπονητή.",
	"sleep-opportunity": "Το διάστημα από την προηγούμενη προπόνηση είναι κάτω από 9 ώρες. Μετακίνησε τη συνεδρία — ο ύπνος προηγείται.",
	"calendar-conflict": "Η συνεδρία συμπίπτει με σχολείο ή ομαδική προπόνηση.",
	"school-buffer": "Δεν μένει αρκετός χρόνος πριν ή μετά το σχολείο.",
	"team-buffer": "Δεν μένουν 2 ώρες μέχρι την ομαδική προπόνηση.",
	"pain": "Αναφέρθηκε πόνος. Σταμάτησε, ενημέρωσε γονέα/προπονητή και ζήτησε επαγγελματική αξιολόγηση.",
	"recovery": "Λίγος ύπνος, χαμηλή ενέργεια ή έντονο πιάσιμο: σήμερα προέχει η ανάπαυση.",
	"fatigue": "Σήμα κόπωσης: δεν προσθέτουμε προσωπική συνεδρία.",
	"high-team-load": "Πολύ υψηλός ομαδικός φόρτος. Μην προσθέτεις άλλη συνεδρία.",
	"checked": "Οι δηλωμένες συνθήκες περνούν τα συντηρητικά φίλτρα. Δεν αποτελεί ιατρική ή προπονητική έγκριση.",
	"disabled": "Οι πρόσθετες συνεδρίες είναι απενεργοποιημένες."
};
var SESSION_TITLE = {
	strength: "Τεχνική δύναμης",
	recovery: "Κινητικότητα & αποκατάσταση",
	primer: "Έλεγχος κίνησης"
};
var SESSION_STATE = {
	ready: "Συνθήκες καταγεγραμμένες",
	"recovery-only": "Μόνο ήπια αποκατάσταση",
	blocked: "Δεν εκτελείται",
	"check-in": "Έλεγχος πριν ξεκινήσεις",
	"coach-review": "Χρειάζεται επίβλεψη",
	disabled: "Ανενεργή"
};
//#endregion
//#region src/components/ui/textarea.tsx
var Textarea = React.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ jsx("textarea", {
		className: cn("flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
//#endregion
//#region src/training/basketball-skills.ts
var text = (el, en) => ({
	el,
	en
});
var video = (id, title, channel = "Jr. NBA Jr. WNBA", level = "foundation") => ({
	url: `https://www.youtube.com/watch?v=${id}`,
	title,
	channel,
	level,
	checkedAt: "2026-11-15",
	verification: "metadata-only"
});
var BT = "BreakthroughBBall";
var BASKETBALL_SKILLS = [
	{
		id: "handling",
		title: text("Έλεγχος μπάλας", "Ball handling"),
		goal: text("Λιγότερη βιασύνη, καλύτερος έλεγχος και με τα δύο χέρια.", "Less rushing; controlled handling with either hand."),
		cues: [
			text("Δάχτυλα ανοιχτά, έλεγχος με τα δάχτυλα και όχι χτύπημα με την παλάμη.", "Spread fingers; control with finger pads rather than slapping with the palm."),
			text("Άνετα λυγισμένα γόνατα· σήκωσε το βλέμμα όσο διατηρείς τον έλεγχο.", "Comfortably bend knees; raise your eyes while maintaining control."),
			text("Το μη κυρίαρχο χέρι παίρνει εξίσου προσεκτική δουλειά, όχι μεγαλύτερη ταχύτητα.", "Give the non-dominant hand equally careful work, not more speed.")
		],
		correction: text("Αν χάνεις την μπάλα, μείωσε ταχύτητα και ύψος πριν προσθέσεις κίνηση.", "If you lose the ball, reduce speed and dribble height before adding movement."),
		easier: text("Στατική ντρίμπλα με ένα χέρι σε ασφαλή, επίπεδη επιφάνεια.", "Stationary one-hand dribbling on a safe, level surface."),
		next: text("Με τον προπονητή: βλέμμα σε στόχο, έπειτα αργή κίνηση και απλή αλλαγή χεριού.", "With your coach: eyes on a target, then slow movement and a simple hand change."),
		observe: text("Ο προπονητής μετρά απώλειες ελέγχου σε ίδιο χρόνο, επιφάνεια και ρυθμό· όχι μόνο ταχύτητα.", "Your coach can compare lost-control events over the same time, surface and pace; not speed alone."),
		equipment: text("Μπάλα · επίπεδος χώρος", "Ball · level space"),
		videos: [
			video("v_jqSQswdbU", "Jr. NBA at Home: 100 Dribble Drill"),
			video("BnvGa0I8bMc", "Fundamentals of Dribbling"),
			video("2_Nqc7eXkBM", "Stationary Crossover (Low/Middle/High)"),
			video("y11vH_H7uWo", "Chris Paul on Ball Handling", void 0, "advanced"),
			video("wJK-BT1GBIc", "3 Two-Ball Drills for ELITE Handles", BT, "advanced")
		]
	},
	{
		id: "shooting",
		title: text("Σουτ & σταθερή ρουτίνα", "Shooting & repeatable routine"),
		goal: text("Ισορροπημένο σουτ από απόσταση που δεν αλλοιώνει την τεχνική.", "Balanced shooting from a distance that preserves your technique."),
		cues: [
			text("Ξεκίνα κοντά· άνετη βάση στήριξης και σταθερό βλέμμα στον στόχο.", "Start close; use a comfortable base and keep eyes on the target."),
			text("Το χέρι υποστήριξης βοηθά τη σταθερότητα, χωρίς να σπρώχνει την απελευθέρωση.", "The guide hand stabilizes without pushing the release."),
			text("Ομαλή κίνηση και ισορροπημένη προσγείωση· η στάση ποδιών προσαρμόζεται με τον προπονητή.", "Use a smooth motion and balanced landing; agree foot alignment with your coach.")
		],
		correction: text("Αν πιέζεις για απόσταση ή χάνεις ισορροπία, πλησίασε· άλλαξε μόνο ένα στοιχείο κάθε φορά.", "If you strain for distance or lose balance, move closer; change only one element at a time."),
		easier: text("Κοντινό σουτ χωρίς πίεση χρόνου, στη δόση που ορίζει ο προπονητής.", "Close-range shots without time pressure, within your coach’s assigned dose."),
		next: text("Πρώτα σταθερή τεχνική, έπειτα μικρή αλλαγή απόστασης ή υποδοχή πάσας — όχι και τα δύο μαζί.", "Establish repeatable form, then slightly change distance or add a catch; not both at once."),
		observe: text("Σύγκρινε εύστοχα/προσπάθειες από ίδια θέση· ένα μικρό δείγμα δεν αποδεικνύει βελτίωση.", "Compare makes/attempts from the same spot; a small sample does not establish improvement."),
		equipment: text("Μπάλα · καλάθι", "Ball · hoop"),
		videos: [
			video("Ftj7lAdgY1k", "7 Spot Shooting | Fun Youth Basketball Drills from the Jr. NBA available in the MOJO App"),
			video("2hY6fQmPJQ8", "10 Best Basketball Form Shooting Drills You Need To Know", BT),
			video("1N01NH1h0ds", "Fix Your Arc With The Stop Shooting Drill", BT, "advanced"),
			video("JqR-SLQDMwI", "\"The Shot Doctor\" - How to Fix Bad Shooting Form – 12 Common Problems Solved", BT, "advanced")
		]
	},
	{
		id: "finishing",
		title: text("Lay-up & βηματισμός", "Layups & footwork"),
		goal: text("Καθαρή ακολουθία βημάτων και έλεγχος και στις δύο πλευρές.", "Clear footwork sequence and control on either side."),
		cues: [
			text("Για κλασικό δεξί lay-up: δεξί–αριστερό, ώθηση από αριστερό, τελείωμα με δεξί· αντίστροφα αριστερά.", "For a conventional right layup: right–left, take off left, finish right; reverse on the left."),
			text("Μάθε πότε μαζεύεις την μπάλα μαζί με τον προπονητή ώστε να αποφεύγεις βήματα.", "Agree the gather timing with your coach to avoid traveling."),
			text("Κοίτα τον στόχο στο ταμπλό και προσγειώσου με έλεγχο σε ελεύθερο χώρο.", "Look at your backboard target and land under control in clear space.")
		],
		correction: text("Αν μπερδεύονται τα βήματα, εξάσκησε πρώτα την ακολουθία περπατώντας χωρίς άλμα.", "If the sequence breaks down, rehearse walking footwork without a jump first."),
		easier: text("Βηματισμός χωρίς μπάλα· έπειτα κοντινό τελείωμα χωρίς επαφή.", "Footwork without a ball, then a close finish without contact."),
		next: text("Ο προπονητής προσθέτει αργή προσέγγιση· επαφή και ταχύτητα μόνο μέσα σε εγκεκριμένη ομαδική δουλειά.", "Your coach can add a slow approach; contact and speed belong in approved team work."),
		observe: text("Έλεγξε τη σωστή ακολουθία ξεχωριστά από την ευστοχία· δούλεψε και τις δύο πλευρές.", "Assess correct footwork separately from shot accuracy; work on both sides."),
		equipment: text("Μπάλα · καλάθι · ελεύθερη προσγείωση", "Ball · hoop · clear landing space"),
		videos: [
			video("3noGvqHdoRE", "Fundamentals of Lay-Ups"),
			video("9z6NtAuiB4U", "Layup Skip Drill"),
			video("YFe1g5F4apY", "The Mikan Drill - Jr. Wizards Instructional Series", "Jr. Wizards", "advanced")
		]
	},
	{
		id: "passing",
		title: text("Πάσα & αποφάσεις", "Passing & decisions"),
		goal: text("Ακρίβεια στον στόχο και έγκαιρη επιλογή, όχι εντυπωσιακές πάσες.", "Accurate targets and timely choices, not flashy passes."),
		cues: [
			text("Δες συμπαίκτη και διάδρομο πάσας πριν αφήσεις την μπάλα.", "See your teammate and the passing lane before releasing."),
			text("Στόχευσε εκεί που μπορεί να υποδεχτεί ο συμπαίκτης· προσάρμοσε δύναμη στην απόσταση.", "Aim where your teammate can receive; match force to distance."),
			text("Υποδοχή με έτοιμα χέρια και ισορροπία· μετά πάσα ή κίνηση με βάση την άμυνα.", "Receive with ready hands and balance; then pass or move based on the defense.")
		],
		correction: text("Αν οι πάσες φεύγουν ψηλά ή χαμηλά, μείωσε απόσταση και ονόμασε τον στόχο πριν πασάρεις.", "If passes miss high or low, shorten the distance and identify the target before passing."),
		easier: text("Στατική πάσα σε συνεργάτη, χωρίς αμυντικό.", "Stationary partner passing without a defender."),
		next: text("Πάσα και μετακίνηση, έπειτα ένας αμυντικός στην ομάδα· όχι νέος αγώνας στην ημέρα ανάπαυσης.", "Pass and move, then add a defender in team practice; not an extra game on your rest day."),
		observe: text("Σημείωσε πάσες που φτάνουν στον στόχο και σωστές επιλογές, όχι μόνο το σύνολο πασών.", "Observe passes reaching the target and good choices, not pass count alone."),
		equipment: text("Μπάλα · συνεργάτες · χώρος", "Ball · partners · space"),
		videos: [
			video("HiYPbqKyeLs", "Circle Passing | Fun Youth Basketball Drills from the Jr. NBA available in the MOJO App"),
			video("H_RY_RrYdX4", "Diamond Passing | Fun Youth Basketball Drills from the Jr. NBA available in the MOJO App"),
			video("NPDt1oHK4aI", "Passing Tag | Fun Youth Basketball Drills from the Jr. NBA available in the MOJO App")
		]
	},
	{
		id: "defense",
		title: text("Άμυνα & έλεγχος σώματος", "Defense & body control"),
		goal: text("Ισορροπία και σωστή απόσταση χωρίς άσκοπα φάουλ.", "Balance and appropriate spacing without unnecessary fouls."),
		cues: [
			text("Άνετη κάμψη ισχίων/γονάτων και βάρος ισορροπημένο· όχι υπερβολικά χαμηλά.", "Comfortably flex hips and knees with balanced weight; avoid forcing an excessively low stance."),
			text("Διάβασε τον κορμό του αντιπάλου και κράτα ενεργά χέρια χωρίς επαφή.", "Read the opponent’s torso and keep hands active without contact."),
			text("Μικρά ελεγχόμενα βήματα για μικρή πλάγια απόσταση· γύρισε και τρέξε όταν χρειάζεται στην ομάδα.", "Use controlled steps for short lateral distances; turn and run when needed in team play.")
		],
		correction: text("Αν χάνεις ισορροπία ή φτάνεις με τα χέρια, μείωσε ταχύτητα και επανέφερε τη βάση στήριξης.", "If you lose balance or reach, slow down and reset your base."),
		easier: text("Στατική στάση και αργά βήματα χωρίς αντίπαλο.", "Static stance and slow steps without an opponent."),
		next: text("Αργός καθρέφτης με συνεργάτη, μετά αποφάσεις στην ομάδα· όχι έξτρα εξαντλητικά slides.", "Slow partner mirroring, then decisions in team practice; not extra exhausting slide drills."),
		observe: text("Ζήτησε έλεγχο ισορροπίας, απόστασης και αποφυγής φάουλ· όχι μόνο κλεψίματα.", "Ask for feedback on balance, spacing and foul avoidance; not steals alone."),
		equipment: text("Επίπεδο γήπεδο · κατάλληλα παπούτσια", "Level court · suitable shoes"),
		videos: [
			video("4A6KqSJX8Ek", "Fundamentals of A Defensive Stance"),
			video("PggPs5r-iJY", "3-Touch Defensive Drill"),
			video("aSvFDJcIzys", "Closeout, Slide, & Backpedal Drill", void 0, "advanced"),
			video("380WaSj2DxE", "2-Person Closeout Drill", void 0, "advanced")
		]
	},
	{
		id: "footwork",
		title: text("Πόδια, pivot & jab step", "Footwork, pivots & jab step"),
		goal: text("Νόμιμος άξονας, ισορροπία και απειλή πριν από ντρίμπλα ή σουτ.", "A legal pivot foot, balance and a threat before you dribble or shoot."),
		cues: [
			text("Διάλεξε πόδι-άξονα και κράτα το στο πάτωμα μέχρι να φύγει η μπάλα από το χέρι για ντρίμπλα.", "Choose a pivot foot and keep it down until the ball leaves your hand on the dribble."),
			text("Triple threat: μπάλα κοντά στο σώμα, γόνατα λυγισμένα, βλέμμα στο καλάθι.", "Triple threat: ball close to the body, knees flexed, eyes on the rim."),
			text("Το jab step είναι μικρό και γρήγορο· το σώμα μένει ισορροπημένο πάνω από τη βάση.", "Keep the jab step short and quick, with your body balanced over your base.")
		],
		correction: text("Αν σέρνεται ή σηκώνεται το πόδι-άξονας, κάνε το αργά χωρίς μπάλα μέχρι να είναι αυτόματο.", "If the pivot foot slides or lifts, rehearse slowly without the ball until it is automatic."),
		easier: text("Μπροστινό και πίσω pivot χωρίς άμυνα, με σταθερή μπάλα.", "Front and reverse pivots without a defender, ball held firmly."),
		next: text("Με τον προπονητή: jab, ψεύτικο σουτ και μία επιλογή (σουτ ή drive) απέναντι σε παθητικό αμυντικό.", "With your coach: jab, shot fake and one read (shoot or drive) against a passive defender."),
		observe: text("Ο προπονητής ελέγχει παραβάσεις βημάτων και ισορροπία, όχι μόνο αν πέτυχε το καλάθι.", "Your coach checks travels and balance, not only whether the shot went in."),
		equipment: text("Μπάλα · καλάθι · επίπεδο γήπεδο", "Ball · hoop · level court"),
		videos: [
			video("5DgXrx7ZkHU", "Reverse Pivot Drill"),
			video("WM90iRaOZ3w", "Fundamentals Of The Jab Step"),
			video("Ggg1unQOFfY", "The Jab Step Breakdown Drill", void 0, "advanced"),
			video("izfKUPxZboc", "Pivot, Shot Fake, Jab Step (Advanced Footwork)", "Atlanta Hawks", "advanced")
		]
	}
];
var BASKETBALL_VIDEO_COUNT = BASKETBALL_SKILLS.reduce((n, s) => n + s.videos.length, 0);
function basketballSkill(id) {
	return BASKETBALL_SKILLS.find((skill) => skill.id === id);
}
//#endregion
//#region src/components/training/BasketballSkills.tsx
function BasketballSkills({ profile }) {
	const { pick } = useI18n();
	const settings = useStore((s) => s.trainingSettings?.[profile.id] ?? EMPTY_TRAINING);
	const saved = basketballSkill(settings.basketballSkillFocus);
	const [selected, setSelected] = useState(saved?.id ?? "handling");
	const skill = basketballSkill(selected) ?? BASKETBALL_SKILLS[0];
	const [note, setNote] = useState(typeof settings.basketballCoachNote === "string" ? settings.basketballCoachNote : "");
	const [didSave, setDidSave] = useState(false);
	const [level, setLevel] = useState("all");
	const videos = skill.videos.filter((v) => isSafeYouTubeWatchUrl(v.url) && (level === "all" || v.level === level));
	const render = (value) => pick(value.el, value.en);
	return /* @__PURE__ */ jsxs("section", {
		className: "border-y py-6",
		"aria-labelledby": "basketball-skills-title",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
					className: "text-xs font-semibold uppercase text-training",
					children: [profile.name, " · Basketball lab"]
				}), /* @__PURE__ */ jsx("h2", {
					id: "basketball-skills-title",
					className: "mt-2 text-2xl font-semibold",
					children: pick("Μία δεξιότητα. Μία καθαρή βελτίωση.", "One skill. One clear refinement.")
				})] }), /* @__PURE__ */ jsxs("span", {
					className: "flex items-center gap-2 text-sm text-training",
					children: [/* @__PURE__ */ jsx(Youtube, { className: "size-4" }), pick(`${BASKETBALL_VIDEO_COUNT} βίντεο · βασικά & προχωρημένα`, `${BASKETBALL_VIDEO_COUNT} videos · foundation & advanced`)]
				})]
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground",
				children: pick("Οι δεξιότητες εντάσσονται στην προπόνηση της ομάδας με τον προπονητή. Δεν προσθέτουν νέες συνεδρίες, λεπτά ή άδεια εκτέλεσης. Τετάρτη: μόνο αποκατάσταση, χωρίς προπόνηση μπάλας.", "Practice these skills within team training with your coach. They add no sessions, minutes or execution clearance. Wednesday remains recovery-only, without ball practice.")
			}),
			/* @__PURE__ */ jsx("div", {
				className: "my-5 flex flex-wrap gap-2",
				role: "group",
				"aria-label": pick("Δεξιότητα μπάσκετ", "Basketball skill"),
				children: BASKETBALL_SKILLS.map((item) => /* @__PURE__ */ jsxs(Button, {
					variant: "outline",
					"aria-pressed": selected === item.id,
					onClick: () => setSelected(item.id),
					className: cn(selected === item.id && "border-training bg-training-surface text-training"),
					children: [/* @__PURE__ */ jsx(Crosshair, { className: "size-4" }), render(item.title)]
				}, item.id))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid items-start gap-6 lg:grid-cols-[1fr_300px]",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ jsx("h3", {
							className: "text-xl font-semibold",
							children: render(skill.title)
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-muted-foreground",
							children: render(skill.goal)
						}),
						/* @__PURE__ */ jsx("ol", {
							className: "mt-4 space-y-3",
							children: skill.cues.map((cue, i) => /* @__PURE__ */ jsxs("li", {
								className: "flex items-start gap-3 text-sm leading-relaxed",
								children: [/* @__PURE__ */ jsx("span", {
									className: "grid size-7 shrink-0 place-items-center rounded-full bg-training-surface font-mono text-training",
									children: i + 1
								}), /* @__PURE__ */ jsx("span", { children: render(cue) })]
							}, cue.en))
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-5 border-l-2 border-training pl-4",
							children: [/* @__PURE__ */ jsx("h4", {
								className: "text-sm font-semibold",
								children: pick("Διόρθωση πριν από δυσκολία", "Correct before progressing")
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-2 text-sm leading-relaxed",
								children: render(skill.correction)
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-5 grid gap-4 border-t pt-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h4", {
								className: "text-sm font-semibold",
								children: pick("Απλούστερα", "Simplify")
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-2 text-sm leading-relaxed text-muted-foreground",
								children: render(skill.easier)
							})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h4", {
								className: "text-sm font-semibold",
								children: pick("Επόμενο βήμα με προπονητή", "Next step with your coach")
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-2 text-sm leading-relaxed text-muted-foreground",
								children: render(skill.next)
							})] })]
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-4 flex items-start gap-2 text-sm leading-relaxed",
							children: [/* @__PURE__ */ jsx(Eye, { className: "mt-1 size-4 shrink-0 text-training" }), render(skill.observe)]
						})
					]
				}), /* @__PURE__ */ jsxs("aside", {
					className: "min-w-0 border-t pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "mb-3 text-xs text-muted-foreground",
							children: render(skill.equipment)
						}),
						/* @__PURE__ */ jsx("h4", {
							className: "font-semibold",
							children: pick("Δες την τεχνική", "Watch the technique")
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-3 flex gap-1 rounded-full border p-1",
							role: "group",
							"aria-label": pick("Επίπεδο βίντεο", "Video level"),
							children: [
								"all",
								"foundation",
								"advanced"
							].map((l) => /* @__PURE__ */ jsx("button", {
								type: "button",
								"aria-pressed": level === l,
								onClick: () => setLevel(l),
								className: cn("flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition-colors", level === l ? "bg-training text-primary-foreground" : "text-muted-foreground hover:bg-muted"),
								children: l === "all" ? pick("Όλα", "All") : l === "foundation" ? pick("Βάση", "Foundation") : pick("Προχωρημένα", "Advanced")
							}, l))
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-2 divide-y",
							children: [videos.length === 0 && /* @__PURE__ */ jsx("p", {
								className: "py-3 text-sm text-muted-foreground",
								children: pick("Δεν υπάρχει βίντεο αυτού του επιπέδου εδώ.", "No video at this level for this skill.")
							}), videos.map((v) => /* @__PURE__ */ jsxs("div", {
								className: "py-3",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ jsx("span", {
											className: cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", v.level === "advanced" ? "bg-training text-primary-foreground" : "bg-training-surface text-training"),
											children: v.level === "advanced" ? pick("Προχωρημένο", "Advanced") : pick("Βάση", "Foundation")
										}), /* @__PURE__ */ jsx("span", {
											className: "truncate text-xs text-muted-foreground",
											children: v.channel
										})]
									}),
									/* @__PURE__ */ jsx("p", {
										className: "mt-1 text-sm leading-relaxed",
										children: v.title
									}),
									/* @__PURE__ */ jsx(Button, {
										asChild: true,
										variant: "outline",
										size: "sm",
										className: "mt-2",
										children: /* @__PURE__ */ jsxs("a", {
											href: v.url,
											target: "_blank",
											rel: "noopener noreferrer",
											children: [/* @__PURE__ */ jsx(Youtube, {}), pick("Άνοιγμα YouTube", "Open YouTube")]
										})
									})
								]
							}, v.url))]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-3 text-xs leading-relaxed text-muted-foreground",
							children: pick("Τα προχωρημένα βίντεο ξεκινούν μόνο όταν η βασική εκδοχή γίνεται σωστά, και μόνο με έγκριση προπονητή.", "Start advanced videos only once the foundation version is clean, and only with your coach’s approval.")
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-3 text-xs leading-relaxed text-muted-foreground",
							children: pick("Jr. NBA · BreakthroughBBall · NBA ομάδες · Τίτλοι, κανάλι και διαθεσιμότητα ελέγχθηκαν 15/11/2026. Όχι πλήρης έλεγχος περιεχομένου. Τα βίντεο είναι παραδείγματα, όχι προσωπική δοσολογία· μην αντιγράφεις αυτόματα επαναλήψεις ή ένταση.", "Jr. NBA · BreakthroughBBall · NBA teams · Titles, channel and availability checked 15/11/2026. Not a full content review. Videos are examples, not a personal dose; do not automatically copy repetitions or intensity.")
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs("form", {
				className: "mt-6 border-t pt-5",
				onSubmit: (e) => {
					e.preventDefault();
					saveTrainingSettings(profile.id, {
						basketballSkillFocus: skill.id,
						basketballCoachNote: note.trim()
					}, profile);
					setDidSave(true);
				},
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center justify-between gap-2",
						children: [/* @__PURE__ */ jsxs("h3", {
							className: "flex items-center gap-2 font-semibold",
							children: [/* @__PURE__ */ jsx(ShieldCheck, { className: "size-4 text-training" }), pick("Η προτεραιότητα με τον προπονητή", "Your priority with the coach")]
						}), saved && /* @__PURE__ */ jsxs("span", {
							className: "text-sm text-training",
							children: [
								pick("Αποθηκευμένο:", "Saved:"),
								" ",
								render(saved.title)
							]
						})]
					}),
					/* @__PURE__ */ jsx("label", {
						htmlFor: "basketball-coach-note",
						className: "mt-3 block text-sm",
						children: pick("Μία συγκεκριμένη παρατήρηση ή ερώτηση για τον προπονητή", "One specific observation or question for your coach")
					}),
					/* @__PURE__ */ jsx(Textarea, {
						id: "basketball-coach-note",
						value: note,
						maxLength: 1e3,
						rows: 3,
						onChange: (e) => {
							setNote(e.target.value);
							setDidSave(false);
						},
						className: "mt-2"
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-3 flex flex-wrap items-center gap-3",
						children: [/* @__PURE__ */ jsxs(Button, {
							type: "submit",
							variant: "outline",
							children: [/* @__PURE__ */ jsx(Check, {}), pick("Αποθήκευση προτεραιότητας", "Save priority")]
						}), /* @__PURE__ */ jsx("span", {
							className: "text-xs text-muted-foreground",
							role: "status",
							children: didSave ? pick("Αποθηκεύτηκε σε αυτή τη συσκευή.", "Saved on this device.") : pick("Η επιλογή δεν αλλάζει το πρόγραμμα ή τον καταγεγραμμένο φόρτο.", "Your choice does not change the schedule or recorded workload.")
						})]
					})
				]
			})
		]
	});
}
function BasketballSessionFocus({ id, note }) {
	const { pick } = useI18n();
	const skill = basketballSkill(id);
	if (!skill) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "my-5 border-l-2 border-training pl-4",
		children: [
			/* @__PURE__ */ jsxs("h3", {
				className: "text-sm font-semibold",
				children: [
					pick("Προτεραιότητα στην επόμενη ομαδική προπόνηση", "Priority for your next team practice"),
					": ",
					pick(skill.title.el, skill.title.en)
				]
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-2 text-sm",
				children: pick(skill.correction.el, skill.correction.en)
			}),
			typeof note === "string" && note.trim() && /* @__PURE__ */ jsx("p", {
				className: "mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground",
				children: note
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-2 text-xs text-muted-foreground",
				children: pick("Σήμερα ακολουθείς μόνο τα βήματα της συνεδρίας παρακάτω. Δεν προσθέτεις ασκήσεις μπάσκετ.", "Today follow only the session steps below. Do not add basketball drills.")
			})
		]
	});
}
//#endregion
//#region src/components/training/SessionCoach.tsx
function ExerciseGuide({ id }) {
	const { t, pick, language } = useI18n();
	const e = exerciseFor(id);
	if (!e) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "border-t py-4 first:border-0",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h4", {
					className: "font-semibold",
					children: pick(e.title.el, e.title.en)
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-xs text-muted-foreground",
					children: e.title.en
				})] }), e.video && isSafeYouTubeWatchUrl(e.video.url) && /* @__PURE__ */ jsx(Button, {
					asChild: true,
					variant: "outline",
					size: "sm",
					className: "shrink-0",
					children: /* @__PURE__ */ jsxs("a", {
						href: e.video.url,
						target: "_blank",
						rel: "noopener noreferrer",
						children: [
							/* @__PURE__ */ jsx(Youtube, {}),
							" ",
							t("Βίντεο τεχνικής")
						]
					})
				})]
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-2 text-sm",
				children: pick(e.cue.el, e.cue.en)
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-3 grid gap-2 text-sm sm:grid-cols-2",
				children: [/* @__PURE__ */ jsxs("p", { children: [/* @__PURE__ */ jsx("span", {
					className: "font-medium text-terracotta",
					children: t("Απόφυγε:")
				}), pick(e.avoid.el, e.avoid.en)] }), /* @__PURE__ */ jsxs("p", { children: [/* @__PURE__ */ jsx("span", {
					className: "font-medium text-training",
					children: t("Πιο εύκολα:")
				}), pick(e.easier.el, e.easier.en)] })]
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "mt-2 text-xs text-muted-foreground",
				children: [pick(e.equipment.el, e.equipment.en), e.video ? t(` · ${e.video.channel} · Έλεγχος τίτλου/διαθεσιμότητας 15/11/2026`) : ""]
			})
		]
	});
}
function SessionCoach({ session, allowed, onClose, onComplete, basketballFocus, basketballNote }) {
	const { t, pick, language } = useI18n();
	const [index, setIndex] = useState(0);
	const [seconds, setSeconds] = useState(0);
	const [running, setRunning] = useState(false);
	const [completedMinutes, setCompletedMinutes] = useState("");
	const reported = Number(completedMinutes);
	const validMinutes = completedMinutes !== "" && Number.isFinite(reported) && reported > 0 && reported <= 240;
	const step = session.steps[index];
	const limit = step.minutes * 60;
	useEffect(() => {
		if (!running) return;
		const timer = window.setInterval(() => setSeconds((x) => Math.min(x + 1, limit)), 1e3);
		return () => window.clearInterval(timer);
	}, [running, limit]);
	useEffect(() => {
		if (seconds >= limit) setRunning(false);
	}, [seconds, limit]);
	const move = (n) => {
		setIndex(n);
		setSeconds(0);
		setRunning(false);
	};
	const remaining = limit - seconds;
	return /* @__PURE__ */ jsx("div", {
		className: "fixed inset-0 z-50 overflow-y-auto bg-background training-page",
		role: "dialog",
		"aria-modal": "true",
		"aria-labelledby": "coach-title",
		onKeyDown: (e) => {
			if (e.key === "Escape") onClose();
		},
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-3xl px-4 py-6 sm:px-8",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between gap-3 border-b pb-4",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
						className: "text-xs text-training",
						children: [
							session.date,
							" ",
							session.start && `· ${session.start}–${session.end}`
						]
					}), /* @__PURE__ */ jsx("h2", {
						id: "coach-title",
						className: "text-xl font-semibold",
						children: session.type === "mobility" ? pick("Κίνηση & κινητικότητα", "Movement & mobility") : t(SESSION_TITLE[session.type])
					})] }), /* @__PURE__ */ jsx(Button, {
						variant: "ghost",
						size: "icon",
						"aria-label": t("Κλείσιμο συνεδρίας"),
						onClick: onClose,
						autoFocus: true,
						children: /* @__PURE__ */ jsx(X, {})
					})]
				}),
				!allowed && /* @__PURE__ */ jsx("p", {
					className: "mt-4 rounded-lg bg-accent p-4 text-sm text-accent-foreground",
					children: t("Προεπισκόπηση μόνο. Δεν έχεις έγκριση εκτέλεσης για αυτή την ημέρα.")
				}),
				index === 0 && /* @__PURE__ */ jsx(BasketballSessionFocus, {
					id: basketballFocus,
					note: basketballNote
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-6 flex gap-1",
					"aria-label": t(`Βήμα ${index + 1} από ${session.steps.length}`),
					children: session.steps.map((_, i) => /* @__PURE__ */ jsx("div", { className: `h-1 flex-1 ${i <= index ? "bg-training" : "bg-muted"}` }, i))
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "mt-6 text-sm font-medium text-training",
					children: [
						t("ΒΗΜΑ"),
						index + 1,
						" / ",
						session.steps.length,
						" ",
						t("· ΠΑΡΑΘΥΡΟ"),
						step.minutes,
						"′"
					]
				}),
				/* @__PURE__ */ jsx("h3", {
					className: "mt-3 text-xl font-semibold leading-relaxed",
					children: pick(step.el, step.en)
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-3 text-sm text-muted-foreground",
					children: t("Ο χρόνος περιλαμβάνει διαλείμματα. Οι επαναλήψεις είναι αυτές του βήματος — δεν συνεχίζεις μέχρι να τελειώσει ο χρόνος.")
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "my-6 flex flex-wrap items-center gap-3 border-y py-5",
					children: [
						/* @__PURE__ */ jsxs("span", {
							className: "mr-auto font-mono text-4xl tabular",
							children: [
								String(Math.floor(remaining / 60)).padStart(2, "0"),
								":",
								String(remaining % 60).padStart(2, "0")
							]
						}),
						/* @__PURE__ */ jsxs(Button, {
							disabled: !allowed,
							onClick: () => setRunning((x) => !x),
							variant: "outline",
							children: [running ? /* @__PURE__ */ jsx(Pause, {}) : /* @__PURE__ */ jsx(Play, {}), running ? t("Παύση") : t("Χρονόμετρο")]
						}),
						/* @__PURE__ */ jsx(Button, {
							variant: "ghost",
							size: "icon",
							"aria-label": t("Μηδενισμός χρόνου"),
							onClick: () => {
								setSeconds(0);
								setRunning(false);
							},
							children: /* @__PURE__ */ jsx(RotateCcw, {})
						})
					]
				}),
				step.exerciseIds.map((id) => /* @__PURE__ */ jsx(ExerciseGuide, { id }, id)),
				index === session.steps.length - 1 && allowed && /* @__PURE__ */ jsxs("label", {
					className: "mt-6 block text-sm font-medium",
					children: [pick("Πόσα λεπτά ολοκλήρωσες πραγματικά;", "How many minutes did you actually complete?"), /* @__PURE__ */ jsx(Input, {
						type: "number",
						min: "1",
						max: "240",
						inputMode: "numeric",
						value: completedMinutes,
						onChange: (e) => setCompletedMinutes(e.target.value),
						className: "mt-2 max-w-40"
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-6 flex flex-wrap justify-between gap-3 border-t pt-5",
					children: [/* @__PURE__ */ jsxs(Button, {
						variant: "outline",
						disabled: index === 0,
						onClick: () => move(index - 1),
						children: [
							/* @__PURE__ */ jsx(ChevronLeft, {}),
							" ",
							t("Πίσω")
						]
					}), index < session.steps.length - 1 ? /* @__PURE__ */ jsxs(Button, {
						onClick: () => move(index + 1),
						children: [t("Επόμενο βήμα"), /* @__PURE__ */ jsx(ChevronRight, {})]
					}) : /* @__PURE__ */ jsxs(Button, {
						disabled: !allowed || !validMinutes,
						onClick: () => {
							onComplete(reported);
							onClose();
						},
						children: [
							/* @__PURE__ */ jsx(Check, {}),
							" ",
							t("Ολοκλήρωσα τη συνεδρία")
						]
					})]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-6 text-sm text-muted-foreground",
					children: t("Πόνος, ζάλη ή αδιαθεσία → διακοπή. Πρώτα ο γονέας/προπονητής, όχι το χρονόμετρο.")
				})
			]
		})
	});
}
//#endregion
//#region src/training/performance-program.js
/**
* ZENITH / ATHLETE ATLAS
* Three requested personal training blocks, explicitly separate from team work.
* This is a conservative educational planning aid, not an individualized medical
* or strength-conditioning clearance. Report planned, cleared and completed
* minutes separately; never conceal inconvenient scheduling conflicts.
*
* Source guidelines:
* USA Basketball youth participation: https://www.usab.com/play/youth-basketball-guidelines
* AAP youth overuse: https://publications.aap.org/pediatrics/article/153/2/e2023065129/196435
* CDC adolescent sleep: https://www.cdc.gov/sleep/about/index.html
* AAP youth resistance: https://publications.aap.org/pediatrics/article/145/6/e20201011/76942/
*/
var PERFORMANCE_FOCUS = Object.freeze([
	"balanced",
	"strength",
	"speed",
	"stamina",
	"movement",
	"durability"
]);
var WORKOUT_OBJECTIVES = Object.freeze([
	{
		key: "strength",
		el: "Τεχνική δύναμης",
		en: "Strength technique"
	},
	{
		key: "speed",
		el: "Μηχανική ταχύτητας",
		en: "Speed mechanics"
	},
	{
		key: "power",
		el: "Ισχύς / έλεγχος",
		en: "Power and control"
	},
	{
		key: "stamina",
		el: "Αντοχή από την ομάδα",
		en: "Endurance from team basketball"
	},
	{
		key: "health",
		el: "Σταθερότητα & πρόληψη",
		en: "Joint stability and prevention"
	}
]);
var SUPPLEMENTARY_SOURCES = Object.freeze([
	{
		name: "USA Basketball · Youth participation",
		url: "https://www.usab.com/play/youth-basketball-guidelines"
	},
	{
		name: "AAP · Overuse & recovery",
		url: "https://publications.aap.org/pediatrics/article/153/2/e2023065129/196435"
	},
	{
		name: "AAP · Youth resistance",
		url: "https://publications.aap.org/pediatrics/article/145/6/e20201011/76942/"
	},
	{
		name: "CDC · Teen sleep 8–10h",
		url: "https://www.cdc.gov/sleep/about/index.html"
	}
]);
var REQUESTED_PERSONAL_SLOTS = Object.freeze([
	{
		index: 0,
		key: "mon",
		type: "strength",
		start: "17:30",
		duration: 45
	},
	{
		index: 2,
		key: "wed",
		type: "recovery",
		start: "19:00",
		duration: 45
	},
	{
		index: 4,
		key: "fri",
		type: "primer",
		start: "06:00",
		duration: 45
	}
]);
var seq = (minutes, el, en) => ({
	minutes,
	el,
	en
});
var DRILLS = Object.freeze({
	strength: [
		seq(8, "Ελεγχόμενη προθέρμανση: βάδισμα 2′, δυναμικά ισχία/αστράγαλοι 3′, ασκήσεις ισορροπίας 3′.", "Easy warm-up: walk 2m; dynamic hips/ankles 3m; balance 3m."),
		seq(8, "Καθίσματα χωρίς επιπλέον βάρος 2 × 8 και split squat με στήριξη 2 × 6/πόδι. Διάλειμμα 60″.", "Bodyweight squats 2 × 8 and supported split squats 2 × 6/leg; 60s rests."),
		seq(7, "Hip hinge με ελαφρύ λάστιχο 2 × 8, άρσεις γάμπας 2 × 10. Ουδέτερη πλάτη, αργή κίνηση.", "Band hip hinge 2 × 8 and slow calf raises 2 × 10; neutral back and controlled tempo."),
		seq(7, "Push-up σε πάγκο 2 × 6–8, ήπιες κωπηλατικές με λάστιχο 2 × 8. Προπονητής ελέγχει την τεχνική.", "Incline push-ups 2 × 6–8 and easy band rows 2 × 8; coach checks technique."),
		seq(6, "Dead bug 2 × 6/πλευρά και side plank 2 × 15″/πλευρά, αναπνοή φυσιολογική.", "Dead bug 2 × 6/side and side plank 2 × 15s/side; breathe normally."),
		seq(4, "Τεχνική επιτάχυνσης ΧΩΡΙΣ σπριντ: στάση σώματος και ρυθμικά βήματα 3 × 15″.", "Acceleration mechanics WITHOUT sprinting: posture and marching drills 3 × 15s."),
		seq(5, "Αποθεραπεία, ήρεμη αναπνοή και έλεγχος πόνου/κόπωσης. Καμία προσπάθεια έως εξάντληση.", "Cool-down, calm breathing and pain/fatigue check; never train to failure.")
	],
	recovery: [
		seq(8, "Περπάτημα και ήρεμη αναπνοή. Καμία προπόνηση μπάσκετ ή τρέξιμο για αντοχή.", "Easy walking and calm breathing; no basketball-specific or endurance session."),
		seq(8, "Ήπιες κινητοποιήσεις ισχίων, θωρακικής μοίρας και αστραγάλων με ελεύθερο εύρος.", "Gentle hip, thoracic spine and ankle mobility within comfortable range."),
		seq(8, "Ισορροπία στο ένα πόδι 2 × 20″/πόδι και ελεγχόμενες άρσεις γάμπας 2 × 8.", "Single-leg balance 2 × 20s/leg; controlled calf raises 2 × 8."),
		seq(8, "Διαφραγματική αναπνοή, ήπιο dead bug 2 × 5/πλευρά και διατάσεις χωρίς πίεση.", "Diaphragmatic breathing, easy dead bug 2 × 5/side and painless stretches."),
		seq(8, "Χαμηλής έντασης διατάσεις/χαλάρωση χωρίς άλματα, σπριντ ή βάρη.", "Gentle stretching and relaxation; no jumping, sprinting or weights."),
		seq(5, "Έλεγχος ύπνου, πόνου και κόπωσης· αν η ημέρα είναι βαριά, προτίμησε πλήρη ανάπαυση.", "Check sleep, pain and fatigue; choose full rest if recovery is inadequate.")
	],
	primer: [
		seq(8, "Μόνο αν έχει αποκατασταθεί επαρκής ύπνος: ήπια κινητοποίηση, χωρίς ένταση.", "Only after adequate sleep opportunity: gentle mobility without intensity."),
		seq(10, "Σταθεροποίηση γόνατος/ποδοκνημικής: ήπια ισορροπία 2 × 20″ και ελεγχόμενα step-ups 2 × 5.", "Knee/ankle control: easy balance 2 × 20s and controlled step-ups 2 × 5."),
		seq(9, "Ρυθμικά βήματα τεχνικής σε χαμηλή ταχύτητα, 3 × 20″ με μακρά διαλείμματα.", "Low-speed footwork mechanics, 3 × 20s with generous rest."),
		seq(8, "Ήπια κινητικότητα ώμων/ισχίων και dead bug 2 × 5/πλευρά.", "Gentle shoulder/hip mobility and dead bug 2 × 5 per side."),
		seq(10, "Αργό περπάτημα, χαλάρωση, νερό και πρωινό. Όχι εξαντλητική αντοχή.", "Slow walking, relaxation, fluids and breakfast; no exhaustive conditioning.")
	]
});
var DRILL_VIDEO_KEYS = Object.freeze({
	strength: [
		[
			"hip-mobility",
			"ankle-mobility",
			"balance"
		],
		["squat", "split"],
		["hinge", "calf"],
		["push", "row"],
		["deadbug", "sideplank"],
		["march"],
		["breathing"]
	],
	recovery: [
		["walk", "breathing"],
		["hip-mobility", "ankle-mobility"],
		["balance", "calf"],
		["breathing", "deadbug"],
		["hip-mobility", "ankle-mobility"],
		["breathing"]
	],
	primer: [
		["hip-mobility", "ankle-mobility"],
		["balance", "stepup"],
		["march"],
		["hip-mobility", "deadbug"],
		["walk", "breathing"]
	]
});
var CLOCK = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
var clock = (m) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
var validInt = (x, a, b, fallback) => Number.isInteger(Number(x)) && Number(x) >= a && Number(x) <= b ? Number(x) : fallback;
function supplementLogId(memberId, date) {
	return "supplement-log:" + memberId + ":" + date;
}
function eligiblePerformanceAthlete(profile, week) {
	const age = Number(profile?.age);
	return profile?.id === "son" && profile?.athlete !== false && age >= 13 && age < 18 && week?.settings?.sport === "basketball";
}
function normalizePersonalSlotPreferences(settings = {}) {
	return REQUESTED_PERSONAL_SLOTS.map((s) => ({
		...s,
		start: CLOCK.test(settings["supplement" + s.key + "Time"] || "") ? settings["supplement" + s.key + "Time"] : s.start,
		duration: validInt(settings["supplement" + s.key + "Minutes"], 40, 60, s.duration)
	}));
}
function previousDay(week, i) {
	return i > 0 ? week.days[i - 1] : null;
}
/** Check both same-day obligations and true overnight opportunity, not a
* purported "recovery score" inferred from height, weight or labels. */
function inspectTrainingWindow(week, slot) {
	const day = week?.days?.[slot.index];
	if (!day) return {
		valid: false,
		reason: "missing-day",
		minutesBeforeSleep: null
	};
	const start = timeMinutes(slot.start);
	const end = start === null ? null : start + slot.duration;
	if (start === null || end > 1440 || slot.duration < 40 || slot.duration > 60) return {
		valid: false,
		reason: "invalid-time",
		minutesBeforeSleep: null
	};
	const events = day.events || [];
	for (const e of events) {
		const a = timeMinutes(e.start), b = timeMinutes(e.end);
		if (a === null || b === null) continue;
		if (start < b && end > a) return {
			valid: false,
			reason: "calendar-conflict",
			minutesBeforeSleep: null
		};
	}
	const school = events.filter((e) => e.type === "school");
	if (school.some((e) => timeMinutes(e.end) <= start && start - timeMinutes(e.end) < 90)) return {
		valid: false,
		reason: "school-buffer",
		minutesBeforeSleep: null
	};
	if (school.some((e) => timeMinutes(e.start) >= end && timeMinutes(e.start) - end < 60)) return {
		valid: false,
		reason: "school-buffer",
		minutesBeforeSleep: null
	};
	if (events.filter((e) => e.type === "team" || e.type === "game").some((e) => timeMinutes(e.start) >= end && timeMinutes(e.start) - end < 120)) return {
		valid: false,
		reason: "team-buffer",
		minutesBeforeSleep: null
	};
	const priorEnds = (previousDay(week, slot.index)?.events || []).filter((e) => e.type === "team" || e.type === "game").map((e) => timeMinutes(e.end)).filter((x) => x !== null);
	const latest = priorEnds.length ? Math.max(...priorEnds) : null;
	const overnight = latest === null ? null : 1440 - latest + start;
	if (overnight !== null && overnight < 540) return {
		valid: false,
		reason: "sleep-opportunity",
		overnightMinutes: overnight
	};
	return {
		valid: true,
		reason: "window-confirmed",
		overnightMinutes: overnight,
		start: slot.start,
		end: clock(end),
		minutes: slot.duration
	};
}
function readinessStatus(day, settings, slot) {
	if (day.readiness?.level === "stop") return {
		state: "blocked",
		reason: "pain"
	};
	if (day.readiness?.level === "recover") return {
		state: "blocked",
		reason: "recovery"
	};
	if (day.readiness?.level === "caution") return {
		state: "blocked",
		reason: "fatigue"
	};
	if (day.readiness?.level !== "normal") return {
		state: "check-in",
		reason: "missing-check-in"
	};
	if (slot.type === "strength" && !settings.coachSupervised) return {
		state: "coach-review",
		reason: "coach-required"
	};
	return {
		state: "ready",
		reason: "checked"
	};
}
function adaptSteps(steps, duration) {
	const source = steps.map((x) => ({ ...x }));
	const original = source.reduce((sum, x) => sum + x.minutes, 0);
	if (duration === original) return source;
	const delta = duration - original;
	if (delta > 0) {
		source[0].minutes += Math.floor(delta / 2);
		source[source.length - 1].minutes += delta - Math.floor(delta / 2);
	} else {
		let n = -delta;
		for (const i of [
			0,
			source.length - 1,
			source.length - 2
		]) {
			const amount = Math.min(n, Math.max(0, source[i].minutes - 2));
			source[i].minutes -= amount;
			n -= amount;
			if (!n) break;
		}
	}
	return source;
}
function buildSupplementaryProgram(profile, week, logs = []) {
	const empty = {
		available: false,
		reason: "unverified-week",
		sessions: [],
		plannedMinutes: 0,
		clearedMinutes: 0,
		completedMinutes: 0,
		remainingMinutes: 0,
		teamMinutes: null,
		objectives: WORKOUT_OBJECTIVES,
		sources: SUPPLEMENTARY_SOURCES
	};
	if (!eligiblePerformanceAthlete(profile, week)) return {
		...empty,
		reason: "not-eligible"
	};
	if (!week.calendarKnown) return empty;
	const settings = week.settings;
	const focus = PERFORMANCE_FOCUS.includes(settings.supplementFocus) ? settings.supplementFocus : "balanced";
	const sessions = normalizePersonalSlotPreferences(settings).map((slot) => {
		const day = week.days[slot.index];
		const window = inspectTrainingWindow(week, slot);
		const check = readinessStatus(day, settings, slot);
		let state = check.state, reason = check.reason;
		if (!window.valid) {
			state = "blocked";
			reason = window.reason;
		}
		if (settings.supplementEnabled === false) {
			state = "disabled";
			reason = "disabled";
		}
		if (week.calendarStats.teamMinutes >= 840 || week.sportDays >= 7) {
			state = "blocked";
			reason = "high-team-load";
		}
		if (slot.type === "recovery" && state === "ready") state = "recovery-only";
		const recorded = logs.find((x) => x?.id === supplementLogId(profile.id, day.date));
		const done = recorded?.done === true;
		return {
			id: supplementLogId(profile.id, day.date),
			date: day.date,
			dayIndex: slot.index,
			type: slot.type,
			start: slot.start,
			end: clock(timeMinutes(slot.start) + slot.duration),
			minutes: slot.duration,
			goals: slot.type === "strength" ? [
				"strength",
				"power",
				"health"
			] : slot.type === "recovery" ? ["mobility", "health"] : ["speed", "health"],
			intensity: slot.type === "recovery" ? "RPE 1–2/10" : "RPE 3–4/10",
			steps: adaptSteps(DRILLS[slot.type], slot.duration).map((step, index) => ({
				...step,
				exerciseIds: DRILL_VIDEO_KEYS[slot.type][index] || []
			})),
			requiresQualifiedCoach: slot.type === "strength",
			state,
			reason,
			done,
			completedMinutes: done && Number.isFinite(recorded?.completedMinutes) ? Math.max(0, recorded.completedMinutes) : 0,
			conflict: window.valid ? null : window.reason,
			overnightMinutes: window.overnightMinutes ?? null,
			teamMinutes: day.sportMinutes,
			schoolMinutes: day.schoolMinutes,
			readiness: day.readiness?.level || "unknown",
			note: slot.type === "recovery" ? "no-sport-specific-training" : null
		};
	});
	const plannedMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);
	const clearedMinutes = sessions.filter((s) => (s.state === "ready" || s.state === "recovery-only") && !s.done).reduce((sum, s) => sum + s.minutes, 0);
	const completedMinutes = sessions.filter((s) => s.done).reduce((sum, s) => sum + s.completedMinutes, 0);
	return {
		available: true,
		reason: null,
		sessions,
		focus,
		plannedMinutes,
		clearedMinutes,
		completedMinutes,
		blockedMinutes: sessions.filter((s) => s.state === "blocked" || s.state === "disabled").reduce((sum, s) => sum + s.minutes, 0),
		remainingMinutes: Math.max(0, plannedMinutes - completedMinutes),
		teamMinutes: week.calendarStats.teamMinutes,
		restPreserved: sessions[1]?.type === "recovery",
		objectives: WORKOUT_OBJECTIVES,
		sleepWarning: week.calendarStats.shortestSchoolTurnaround?.minutes < 540,
		sources: SUPPLEMENTARY_SOURCES
	};
}
//#endregion
//#region src/training/member-program.ts
var WHO_ACTIVITY = "https://www.who.int/news-room/fact-sheets/detail/physical-activity";
var copy = (el, en) => ({
	el,
	en
});
function memberFocus(p) {
	if (p.age < 18) return copy("Κίνηση, αυτοπεποίθηση & ανάπτυξη", "Movement, confidence & growth");
	if (p.goal === "gradual_fat_loss") return copy("Δύναμη & σταθερή καθημερινή κίνηση", "Strength & steady daily movement");
	return copy("Καρδιομεταβολική υγεία & λειτουργική δύναμη", "Cardiometabolic health & functional strength");
}
function memberDefaults(p) {
	return {
		...defaultFitnessSettings(p),
		goal: p.age < 18 ? "mobility" : "wellbeing",
		schedule: [
			"free",
			"light",
			"free",
			"light",
			"free",
			"light",
			"rest"
		],
		minutes: p.age < 18 ? 15 : 25,
		strengthSessions: p.age < 18 ? 0 : 2
	};
}
function buildMemberProgram(p, saved, logs, start) {
	const settings = {
		...memberDefaults(p),
		...saved,
		...p.age < 18 ? {
			strengthSessions: 0,
			goal: "mobility"
		} : {}
	};
	const week = buildFitnessWeek(p, settings, logs, start);
	const sessions = week.days.map((d, i) => {
		const readiness = assessReadiness(logs.find((l) => l.id !== void 0 ? l.id === fitnessLogId(p.id, d.date) : l.memberId === p.id && l.date === d.date), p);
		const strength = d.kind === "strength";
		const rest = d.mode === "rest" || d.kind === "rest" || d.kind === "team" || d.kind === "game" || d.kind === "unconfirmed";
		const state = readiness.level === "stop" || readiness.level === "recover" || readiness.level === "caution" ? "blocked" : rest ? "disabled" : readiness.level !== "normal" ? "check-in" : "ready";
		const reason = readiness.level === "stop" ? "pain" : readiness.level === "recover" ? "recovery" : readiness.level === "caution" ? "fatigue" : rest ? "rest" : state === "check-in" ? "missing-check-in" : "checked";
		const minutes = rest || state === "blocked" ? 0 : d.duration;
		let steps;
		if (strength) steps = [
			{
				minutes: 5,
				...copy("Ήπια προθέρμανση: περπάτημα και άνετη κινητικότητα ισχίων/αστραγάλων.", "Easy warm-up: walk and gently move hips and ankles."),
				exerciseIds: ["hip-mobility", "ankle-mobility"]
			},
			{
				minutes: Math.max(5, minutes - 10),
				...copy("Ξεκίνα με 1 σετ: κάθισμα προς καρέκλα × 8, push-up στον τοίχο × 8, άρσεις γάμπας × 10 και dead bug × 6/πλευρά. 60″ ανάπαυση μεταξύ ασκήσεων. Δεύτερο σετ μόνο αν η τεχνική παραμένει άνετη.", "Start with 1 set: chair squat × 8, wall push-up × 8, calf raise × 10 and dead bug × 6/side. Rest 60 sec between exercises. Add a second set only while technique remains comfortable."),
				exerciseIds: [
					"squat",
					"push",
					"calf",
					"deadbug"
				]
			},
			{
				minutes: 5,
				...copy("Χαλαρό περπάτημα και φυσιολογική αναπνοή. Καμία προσπάθεια έως εξάντληση.", "Easy walking and normal breathing. Never train to failure."),
				exerciseIds: ["walk", "breathing"]
			}
		];
		else steps = [{
			minutes: Math.max(1, minutes - 5),
			...copy(p.age < 18 ? "Διάλεξε κίνηση που απολαμβάνεις: ήπιο περπάτημα, χορό ή ποδήλατο. Άνετος ρυθμός, χωρίς στόχο καύσης θερμίδων." : "Περπάτημα σε επίπεδη ασφαλή διαδρομή, σε άνετο ρυθμό που επιτρέπει συνομιλία. Ξεκίνα με λιγότερα λεπτά αν είσαι αδρανής.", p.age < 18 ? "Choose movement you enjoy: easy walking, dancing or cycling. Comfortable pace, with no calorie-burning target." : "Walk on a safe level route at a comfortable talking pace. Start with fewer minutes if you have been inactive."),
			exerciseIds: ["walk"]
		}, {
			minutes: 5,
			...copy("Ήπια κινητικότητα ισχίων/αστραγάλων και ισορροπία με στήριξη: 1 × 20″/πόδι. Σταμάτα αν υπάρχει πόνος.", "Gentle hip/ankle mobility and supported balance: 1 × 20 sec/leg. Stop if painful."),
			exerciseIds: [
				"hip-mobility",
				"ankle-mobility",
				"balance"
			]
		}];
		return {
			id: `member-session:${p.id}:${d.date}`,
			date: d.date,
			dayIndex: i,
			type: strength ? "strength" : "mobility",
			start: "",
			end: "",
			minutes,
			intensity: "RPE 2–4/10",
			steps,
			state,
			reason,
			done: logs.some((l) => l.id === `member-session:${p.id}:${d.date}` && l.done === true)
		};
	});
	return {
		week,
		sessions,
		settings,
		focus: memberFocus(p),
		plannedMinutes: sessions.reduce((n, s) => n + s.minutes, 0),
		completedMinutes: logs.filter((l) => l.memberId === p.id && l.done === true && l.date >= start && l.date <= shiftDate(start, 6) && String(l.id).startsWith("member-session:")).reduce((n, l) => n + Math.max(0, Number(l.completedMinutes) || 0), 0)
	};
}
//#endregion
//#region src/components/training/MemberTraining.tsx
function MemberTraining({ profile }) {
	const { t, pick, language } = useI18n();
	const today = useToday();
	const [start, setStart] = useState(weekStartOf(today));
	const [selected, setSelected] = useState(((/* @__PURE__ */ new Date(today + "T12:00:00Z")).getUTCDay() + 6) % 7);
	const [coach, setCoach] = useState(false);
	const settings = useStore((s) => s.trainingSettings?.[profile.id] ?? EMPTY_TRAINING);
	const logMap = useStore((s) => s.trainingLogs ?? EMPTY_TRAINING);
	const logs = useMemo(() => Object.values(logMap), [logMap]);
	const program = useMemo(() => buildMemberProgram(profile, settings, logs, start), [
		profile,
		settings,
		logs,
		start
	]);
	const session = program.sessions[selected];
	const canExecute = session.date === today && session.state === "ready" && !session.done;
	const days = language === "en" ? [
		"Mon",
		"Tue",
		"Wed",
		"Thu",
		"Fri",
		"Sat",
		"Sun"
	] : [
		"Δευ",
		"Τρί",
		"Τετ",
		"Πέμ",
		"Παρ",
		"Σάβ",
		"Κυρ"
	];
	const complete = (done, minutes = 0) => {
		if (done && !canExecute) return;
		saveTrainingLog(session.id, {
			id: session.id,
			memberId: profile.id,
			date: session.date,
			done,
			completedMinutes: done ? minutes : 0,
			completedAt: done ? (/* @__PURE__ */ new Date()).toISOString() : null
		});
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "training-page space-y-6",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "border-b py-5",
				children: [
					/* @__PURE__ */ jsxs("p", {
						className: "text-sm font-medium text-training",
						children: [
							profile.name,
							" · ",
							profile.age,
							" ",
							pick("ετών", "years")
						]
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "mt-2 text-2xl font-semibold",
						children: pick(program.focus.el, program.focus.en)
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-3 max-w-3xl text-sm text-muted-foreground",
						children: profile.age < 18 ? pick("Η κίνηση υποστηρίζει ανάπτυξη και ευεξία. Χωρίς στόχο απώλειας βάρους ή μέτρηση καύσης θερμίδων.", "Movement supports growth and wellbeing. No weight-loss targets or calorie-burning scores.") : pick("Συντηρητικό πρόγραμμα εκκίνησης, προσαρμοσμένο στην ηλικία και τον δηλωμένο στόχο. Δεν γνωρίζουμε ιατρικό ιστορικό ή φυσική κατάσταση.", "A conservative starting plan adapted to age and stated goals. Medical history and fitness level are unknown.")
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("p", {
					className: "font-medium",
					children: [
						start,
						" — ",
						shiftDate(start, 6)
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex gap-2",
					children: [
						/* @__PURE__ */ jsx(Button, {
							size: "icon",
							variant: "outline",
							"aria-label": t("Προηγούμενη εβδομάδα"),
							onClick: () => setStart(shiftDate(start, -7)),
							children: /* @__PURE__ */ jsx(ArrowLeft, {})
						}),
						/* @__PURE__ */ jsx(Button, {
							variant: "outline",
							onClick: () => {
								setStart(weekStartOf(today));
								setSelected(((/* @__PURE__ */ new Date(today + "T12:00:00Z")).getUTCDay() + 6) % 7);
							},
							children: t("Σήμερα")
						}),
						/* @__PURE__ */ jsx(Button, {
							size: "icon",
							variant: "outline",
							"aria-label": t("Επόμενη εβδομάδα"),
							onClick: () => setStart(shiftDate(start, 7)),
							children: /* @__PURE__ */ jsx(ArrowRight, {})
						})
					]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-7 gap-1 sm:gap-2",
				children: program.sessions.map((s, i) => /* @__PURE__ */ jsxs(Button, {
					variant: "outline",
					onClick: () => setSelected(i),
					"aria-pressed": selected === i,
					className: cn("flex-col rounded-lg px-1 py-3 text-xs", selected === i && "border-training bg-training-surface"),
					children: [
						/* @__PURE__ */ jsx("span", { children: days[i] }),
						/* @__PURE__ */ jsx("span", {
							className: "text-lg",
							children: Number(s.date.slice(-2))
						}),
						/* @__PURE__ */ jsx("span", { children: s.type === "strength" ? pick("Δύναμη", "Strength") : s.minutes === 0 ? t("Ανάπαυση") : pick("Κίνηση", "Move") })
					]
				}, s.id))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid items-start gap-8 lg:grid-cols-[1fr_300px]",
				children: [/* @__PURE__ */ jsxs("section", { children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap justify-between gap-3",
						children: [/* @__PURE__ */ jsxs("h3", {
							className: "text-xl font-semibold",
							children: [
								session.minutes === 0 ? t("Ανάπαυση") : session.type === "strength" ? t("Τεχνική δύναμης") : pick("Κίνηση & κινητικότητα", "Movement & mobility"),
								" · ",
								session.minutes,
								"′"
							]
						}), session.minutes > 0 && /* @__PURE__ */ jsx(Button, {
							onClick: () => setCoach(true),
							children: canExecute ? t("Έναρξη συνεδρίας") : t("Προεπισκόπηση")
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-4 bg-training-surface p-4 text-sm",
						children: session.reason === "rest" ? pick("Πλήρης ανάπαυση. Δεν χρειάζεται να κερδίσεις το φαγητό σου με άσκηση.", "Full rest. You do not need to earn your food through exercise.") : t(REASONS[session.reason])
					}),
					session.minutes > 0 && /* @__PURE__ */ jsx("ol", {
						className: "mt-4 divide-y",
						children: session.steps.map((step, i) => /* @__PURE__ */ jsxs("li", {
							className: "py-4",
							children: [
								/* @__PURE__ */ jsxs("p", {
									className: "font-medium",
									children: [
										i + 1,
										". ",
										pick(step.el, step.en)
									]
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "mt-2 text-xs text-muted-foreground",
									children: [
										step.minutes,
										"′ ",
										pick("μαζί με διαλείμματα", "including rest")
									]
								}),
								/* @__PURE__ */ jsxs("details", {
									className: "mt-3",
									children: [/* @__PURE__ */ jsx("summary", {
										className: "text-sm font-medium text-training",
										children: pick("Τεχνική & βίντεο", "Technique & videos")
									}), step.exerciseIds.map((id) => /* @__PURE__ */ jsx(ExerciseGuide, { id }, id))]
								})
							]
						}, i))
					}),
					session.done && /* @__PURE__ */ jsxs(Button, {
						variant: "outline",
						onClick: () => complete(false),
						children: [/* @__PURE__ */ jsx(Undo2, {}), t("Αναίρεση ολοκλήρωσης")]
					})
				] }), /* @__PURE__ */ jsxs("aside", {
					className: "space-y-5 border-t pt-5 lg:border-l lg:border-t-0 lg:pl-5",
					children: [
						/* @__PURE__ */ jsx("h3", {
							className: "font-semibold",
							children: t("Πριν ξεκινήσεις")
						}),
						session.date === today ? /* @__PURE__ */ jsx(ReadinessForm, {
							profile,
							date: today,
							log: logMap[fitnessLogId(profile.id, today)]
						}, profile.id + today) : /* @__PURE__ */ jsx("p", {
							className: "text-sm text-muted-foreground",
							children: t("Ο έλεγχος ανοίγει μόνο την ημέρα της συνεδρίας. Η ιστορική ή μελλοντική προβολή δεν δίνει άδεια εκτέλεσης.")
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-sm",
							children: [
								/* @__PURE__ */ jsxs("b", { children: [pick("Καταγεγραμμένες συνεδρίες", "Completed sessions"), ":"] }),
								" ",
								program.completedMinutes,
								"′"
							]
						}),
						/* @__PURE__ */ jsxs("details", { children: [/* @__PURE__ */ jsx("summary", {
							className: "text-sm font-semibold",
							children: pick("Ημέρες & χρόνος", "Days & time")
						}), /* @__PURE__ */ jsxs("div", {
							className: "mt-3 space-y-3",
							children: [/* @__PURE__ */ jsxs("label", {
								className: "block text-sm",
								children: [pick("Χρόνος εκκίνησης", "Starting duration"), /* @__PURE__ */ jsx("select", {
									className: "mt-1 h-10 w-full rounded-md border bg-background",
									value: program.settings.minutes,
									onChange: (e) => saveTrainingSettings(profile.id, {
										...program.settings,
										minutes: Number(e.target.value)
									}, profile),
									children: [
										10,
										15,
										20,
										25,
										30
									].filter((n) => profile.age >= 18 || n <= 20).map((n) => /* @__PURE__ */ jsxs("option", {
										value: n,
										children: [n, " min"]
									}, n))
								})]
							}), days.map((day, i) => /* @__PURE__ */ jsxs("label", {
								className: "flex items-center justify-between gap-2 text-sm",
								children: [day, /* @__PURE__ */ jsx("select", {
									className: "h-9 rounded-md border bg-background",
									value: program.settings.schedule[i],
									onChange: (e) => {
										const schedule = [...program.settings.schedule];
										schedule[i] = e.target.value;
										saveTrainingSettings(profile.id, {
											...program.settings,
											schedule
										}, profile);
									},
									children: [
										"free",
										"light",
										"rest"
									].map((mode) => /* @__PURE__ */ jsx("option", {
										value: mode,
										children: mode === "free" ? pick("Διαθέσιμη", "Available") : mode === "light" ? pick("Ήπια κίνηση", "Light movement") : t("Ανάπαυση")
									}, mode))
								})]
							}, day))]
						})] })
					]
				})]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "border-t pt-5",
				children: [
					/* @__PURE__ */ jsxs("h3", {
						className: "flex items-center gap-2 font-semibold",
						children: [/* @__PURE__ */ jsx(ShieldCheck, { className: "size-5 text-training" }), pick("Κατευθυντήριες οδηγίες, όχι προσωπική συνταγή", "Guidelines, not a personal prescription")]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-3 text-sm",
						children: profile.age < 18 ? pick("ΠΟΥ: ηλικίες 5–17, κατά μέσο όρο 60 λεπτά μέτριας/έντονης δραστηριότητας ημερησίως μέσα στην εβδομάδα· δραστηριότητες μυών/οστών τουλάχιστον 3 ημέρες. Η σχολική άσκηση και το παιχνίδι προσμετρώνται. Αυτό το ήπιο πρόγραμμα είναι μόνο ένα μικρό μέρος.", "WHO: ages 5–17, an average of 60 minutes of moderate-to-vigorous activity per day across the week, with muscle/bone-strengthening activity at least 3 days. School activity and play count. This gentle starter plan is only one small part.") : pick("ΠΟΥ: 150–300 λεπτά μέτριας αερόβιας δραστηριότητας εβδομαδιαίως και ενδυνάμωση τουλάχιστον 2 ημέρες. Ξεκίνα χαμηλά και αύξησε σταδιακά, ανάλογα με δυνατότητες και επαγγελματική καθοδήγηση.", "WHO: 150–300 minutes of moderate aerobic activity weekly and strength work at least 2 days. Start small and progress gradually according to ability and professional guidance.")
					}),
					/* @__PURE__ */ jsx("a", {
						className: "mt-3 inline-block text-sm text-training underline",
						href: WHO_ACTIVITY,
						target: "_blank",
						rel: "noopener noreferrer",
						children: "WHO · Physical activity"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-3 text-sm text-muted-foreground",
						children: pick("Πόνος στο στήθος, έντονη δύσπνοια, ζάλη ή οξύς πόνος: διακοπή και κατάλληλη ιατρική βοήθεια. Οι παθήσεις και τα φάρμακα μπορεί να χρειάζονται εξατομίκευση.", "Chest pain, severe breathlessness, dizziness or sharp pain: stop and seek appropriate medical help. Conditions and medication may require individual adaptation.")
					})
				]
			}),
			coach && /* @__PURE__ */ jsx(SessionCoach, {
				session,
				allowed: canExecute,
				onClose: () => setCoach(false),
				onComplete: (minutes) => complete(true, minutes)
			})
		]
	});
}
//#endregion
//#region src/routes/training.tsx?tsr-split=component
var DAYS = [
	"Δευ",
	"Τρί",
	"Τετ",
	"Πέμ",
	"Παρ",
	"Σάβ",
	"Κυρ"
];
function Training() {
	const { pick } = useI18n();
	const profiles = useStore((s) => s.profiles);
	const activeId = useStore((s) => s.activeId);
	const active = profiles.find((p) => p.id === activeId) ?? profiles[0];
	if (!active) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "text-xs font-medium uppercase text-training",
				children: "Zenith · Movement studio"
			}), /* @__PURE__ */ jsx("h1", {
				className: "mt-2 text-3xl font-semibold sm:text-4xl",
				children: pick("Η δική σου προπόνηση", "Your training")
			})] }),
			/* @__PURE__ */ jsx(MemberSwitcher, {}),
			/* @__PURE__ */ jsx("div", { children: active.id === "son" && active.athlete ? /* @__PURE__ */ jsx(BasketballTraining, {}) : /* @__PURE__ */ jsx(MemberTraining, { profile: active }) }, active.id)
		]
	});
}
function BasketballTraining() {
	const { t, pick, language } = useI18n();
	const profiles = useStore((s) => s.profiles);
	useStore((s) => s.activeId);
	const profile = profiles.find((p) => p.id === "son");
	const stored = useStore((s) => s.trainingSettings?.["son"] ?? EMPTY_TRAINING);
	const logMap = useStore((s) => s.trainingLogs ?? EMPTY_TRAINING);
	const logs = useMemo(() => Object.values(logMap), [logMap]);
	const today = todayKey();
	const [start, setStart] = useState(() => weekStartOf(today));
	const [selected, setSelected] = useState(0);
	const [coach, setCoach] = useState(false);
	const settings = useMemo(() => ({
		...defaultFitnessSettings(profile),
		...stored
	}), [profile, stored]);
	const week = useMemo(() => buildFitnessWeek(profile, settings, logs, start), [
		profile,
		settings,
		logs,
		start
	]);
	const program = useMemo(() => buildSupplementaryProgram(profile, week, logs), [
		profile,
		week,
		logs
	]);
	if (!profile) return /* @__PURE__ */ jsx("p", { children: t("Το πρόγραμμα χρειάζεται το προφίλ του αθλητή της οικογένειας.") });
	const session = program.sessions[selected];
	const canExecute = Boolean(session && !session.done && session.date === today && ["ready", "recovery-only"].includes(session.state));
	const changeWeek = (date) => {
		setStart(date);
		setSelected(0);
		setCoach(false);
	};
	const completed = (done, minutes = 0) => {
		if (!session || done && !canExecute) return;
		saveTrainingLog(session.id, {
			id: session.id,
			memberId: profile.id,
			date: session.date,
			done,
			completedMinutes: done ? minutes : 0,
			completedAt: done ? (/* @__PURE__ */ new Date()).toISOString() : null
		});
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "training-page space-y-6",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "relative min-h-60 overflow-hidden border-b animate-rise",
				children: [
					/* @__PURE__ */ jsx("img", {
						src: basketball_court_default,
						alt: t("Φωτεινό γήπεδο μπάσκετ με μπάλα και πετσέτα"),
						width: 1600,
						height: 912,
						className: "absolute inset-0 h-full w-full object-cover"
					}),
					/* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-background/25" }),
					/* @__PURE__ */ jsxs("div", {
						className: "relative max-w-md py-8 pr-5 sm:py-10",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "mb-3 text-sm font-semibold uppercase text-training",
								children: "Zenith · Athlete studio"
							}),
							/* @__PURE__ */ jsxs("h1", {
								className: "text-3xl font-bold leading-tight sm:text-4xl",
								children: [
									t("Μπάσκετ."),
									/* @__PURE__ */ jsx("br", {}),
									t("Πιο δυνατά,"),
									/* @__PURE__ */ jsx("br", {}),
									t("με σωστό ρυθμό.")
								]
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "mt-4 max-w-64 text-sm font-medium",
								children: [
									profile.name,
									" ",
									t("· Ατομικό πρόγραμμα"),
									/* @__PURE__ */ jsx("br", {}),
									t("Συμπληρώνει την ομάδα. Δεν την ανταγωνίζεται.")
								]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ jsx(BasketballSkills, { profile }),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
					className: "text-xl font-semibold",
					children: t("Η εβδομάδα σου")
				}), /* @__PURE__ */ jsxs("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: [
						start,
						" — ",
						shiftDate(start, 6),
						" · ",
						week.calendarKnown ? t("Καταγεγραμμένες υποχρεώσεις") : t("Χρειάζεται επιβεβαίωση ομάδας")
					]
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ jsx(Button, {
							variant: "outline",
							size: "icon",
							"aria-label": t("Προηγούμενη εβδομάδα"),
							onClick: () => changeWeek(shiftDate(start, -7)),
							children: /* @__PURE__ */ jsx(ArrowLeft, {})
						}),
						/* @__PURE__ */ jsx(Button, {
							variant: "outline",
							onClick: () => changeWeek(weekStartOf(today)),
							children: t("Σήμερα")
						}),
						/* @__PURE__ */ jsx(Button, {
							variant: "outline",
							size: "icon",
							"aria-label": t("Επόμενη εβδομάδα"),
							onClick: () => changeWeek(shiftDate(start, 7)),
							children: /* @__PURE__ */ jsx(ArrowRight, {})
						})
					]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-2 gap-4 border-y py-5 sm:grid-cols-4",
				children: [
					[t("Ομάδα"), week.calendarKnown ? `${week.calendarStats.teamMinutes}′` : "—"],
					[t("Ατομικά παράθυρα"), `${program.plannedMinutes}′`],
					[t("Συνθήκες ελέγχθηκαν"), `${program.clearedMinutes}′`],
					[t("Ολοκληρωμένα"), `${program.completedMinutes}′`]
				].map(([label, value]) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-xs text-muted-foreground",
					children: label
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-3xl font-semibold tabular",
					children: value
				})] }, label))
			}),
			week.calendarStats.tentativeMinutes > 0 && /* @__PURE__ */ jsxs("p", {
				className: "text-sm text-muted-foreground",
				children: [
					"+ ",
					week.calendarStats.tentativeMinutes,
					t("′ μη επιβεβαιωμένων υποχρεώσεων ομάδας. Δεν μετρούν ως επιβεβαιωμένος φόρτος.")
				]
			}),
			!week.calendarKnown && /* @__PURE__ */ jsxs("section", {
				className: "border-l-4 border-training bg-training-surface p-5",
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "font-semibold",
						children: t("Πρώτα το πραγματικό πρόγραμμα της ομάδας")
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-2 text-sm",
						children: t("Δεν μεταφέραμε την παλιά εβδομάδα στο σήμερα. Επιβεβαίωσε τις τωρινές υποχρεώσεις παρακάτω για να προσαρμοστούν οι ατομικές συνεδρίες.")
					}),
					/* @__PURE__ */ jsxs(Button, {
						variant: "outline",
						className: "mt-3",
						onClick: () => changeWeek("2026-11-02"),
						children: [t("Αρχικό πρόγραμμα · 2–8 Νοεμβρίου"), /* @__PURE__ */ jsx(ChevronRight, {})]
					})
				]
			}),
			start < weekStartOf(today) && /* @__PURE__ */ jsx("p", {
				className: "border-l-4 border-warning bg-accent p-4 text-sm",
				children: t("Ιστορική εβδομάδα · προεπισκόπηση, όχι σημερινή άδεια προπόνησης. Δεν καταγράφουμε αναδρομικά ετοιμότητα.")
			}),
			week.highYouthLoad && /* @__PURE__ */ jsxs("p", {
				className: "flex items-start gap-3 bg-training-surface p-4 text-sm",
				children: [/* @__PURE__ */ jsx(ShieldCheck, { className: "size-5 shrink-0 text-training" }), t("Υψηλός φόρτος ομάδας: κανένα έξτρα σπριντ, άλματα ή εξαντλητική αντοχή. Οι πλήρεις συνεδρίες χρειάζονται έλεγχο από τον προπονητή της ομάδας.")]
			}),
			week.calendarKnown && /* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-7 gap-1 border-b pb-5 sm:gap-2",
				children: week.days.map((day, i) => /* @__PURE__ */ jsxs("div", {
					className: cn("min-w-0 rounded-lg px-1 py-3 text-center", day.date === today ? "bg-training text-training-foreground" : "bg-muted/50"),
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-xs font-medium",
							children: DAYS[i]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-1 text-lg font-semibold",
							children: Number(day.date.slice(-2))
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[10px] sm:text-xs",
							children: day.mode === "team" ? t("Ομάδα") : day.mode === "game" ? t("Αγώνας") : t("Ανάπαυση")
						}),
						program.sessions.some((s) => s.dayIndex === i) && /* @__PURE__ */ jsx(Dumbbell, { className: "mx-auto mt-2 size-4" })
					]
				}, day.date))
			}),
			/* @__PURE__ */ jsx(CalendarEditor, {
				profile,
				start,
				settings,
				events: week.calendar.events
			}, `${start}-${JSON.stringify(week.calendar.events)}`),
			program.available && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", {
				className: "grid gap-3 md:grid-cols-3",
				children: program.sessions.map((s, i) => /* @__PURE__ */ jsxs(Button, {
					variant: "outline",
					onClick: () => setSelected(i),
					"aria-pressed": selected === i,
					className: cn("flex items-start justify-start gap-3 rounded-lg p-4 text-left", selected === i && "border-training bg-training-surface"),
					children: [/* @__PURE__ */ jsxs("span", {
						className: "font-mono text-2xl text-training",
						children: ["0", i + 1]
					}), /* @__PURE__ */ jsxs("span", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "block text-xs text-muted-foreground",
								children: [
									DAYS[s.dayIndex],
									" · ",
									s.start,
									"–",
									s.end
								]
							}),
							/* @__PURE__ */ jsx("span", {
								className: "mt-1 block font-semibold",
								children: t(SESSION_TITLE[s.type])
							}),
							/* @__PURE__ */ jsx("span", {
								className: cn("mt-2 block text-xs", s.state === "blocked" ? "text-destructive" : "text-training"),
								children: s.done ? t("Ολοκληρωμένη") : SESSION_STATE[s.state]
							})
						]
					})]
				}, s.id))
			}), session && /* @__PURE__ */ jsxs("div", {
				className: "grid items-start gap-8 lg:grid-cols-[1fr_300px]",
				children: [/* @__PURE__ */ jsxs("section", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex flex-wrap items-start justify-between gap-3",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
								className: "text-sm text-training",
								children: [
									session.date,
									" · ",
									session.minutes,
									t("′ παράθυρο ·"),
									session.intensity
								]
							}), /* @__PURE__ */ jsx("h2", {
								className: "mt-2 text-2xl font-semibold",
								children: t(SESSION_TITLE[session.type])
							})] }), /* @__PURE__ */ jsxs(Button, {
								onClick: () => setCoach(true),
								children: [
									/* @__PURE__ */ jsx(PlayIcon, {}),
									" ",
									canExecute ? t("Έναρξη συνεδρίας") : t("Προεπισκόπηση")
								]
							})]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-4 border-l-4 border-training bg-training-surface p-4 text-sm",
							children: t(REASONS[session.reason] ?? session.reason)
						}),
						/* @__PURE__ */ jsx(BasketballSessionFocus, {
							id: settings.basketballSkillFocus,
							note: settings.basketballCoachNote
						}),
						/* @__PURE__ */ jsx("p", {
							className: "my-4 text-sm text-muted-foreground",
							children: t("Τα λεπτά περιλαμβάνουν προθέρμανση και ανάπαυση, όχι συνεχή άσκηση. Ακολούθησε τη δόση κάθε βήματος. Τα βίντεο δείχνουν τεχνική, όχι ένταση ή θεραπεία.")
						}),
						/* @__PURE__ */ jsx("ol", { children: session.steps.map((step, i) => /* @__PURE__ */ jsx("li", {
							className: "border-b py-4",
							children: /* @__PURE__ */ jsxs("details", {
								open: i === 0,
								children: [/* @__PURE__ */ jsxs("summary", {
									className: "flex list-none items-start gap-3",
									children: [
										/* @__PURE__ */ jsx("span", {
											className: "grid size-8 shrink-0 place-items-center rounded-full bg-training-surface font-mono text-sm text-training",
											children: i + 1
										}),
										/* @__PURE__ */ jsx("span", {
											className: "min-w-0 flex-1 text-sm leading-relaxed",
											children: pick(step.el, step.en)
										}),
										/* @__PURE__ */ jsxs("span", {
											className: "shrink-0 text-sm font-medium text-training",
											children: [step.minutes, "′"]
										})
									]
								}), /* @__PURE__ */ jsx("div", {
									className: "mt-3 pl-0 sm:pl-11",
									children: step.exerciseIds.map((id) => /* @__PURE__ */ jsx(ExerciseGuide, { id }, id))
								})]
							})
						}, i)) }),
						session.done && /* @__PURE__ */ jsxs(Button, {
							className: "mt-4",
							variant: "outline",
							onClick: () => completed(false),
							children: [
								/* @__PURE__ */ jsx(Undo2, {}),
								" ",
								t("Αναίρεση ολοκλήρωσης")
							]
						})
					]
				}), /* @__PURE__ */ jsxs("aside", {
					className: "space-y-6 border-t pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("h3", {
							className: "mb-3 flex items-center gap-2 font-semibold",
							children: [
								/* @__PURE__ */ jsx(Moon, { className: "size-4 text-training" }),
								" ",
								t("Πριν ξεκινήσεις")
							]
						}), session.date === today ? /* @__PURE__ */ jsx(ReadinessForm, {
							profile,
							date: today,
							log: logMap[fitnessLogId(profile.id, today)]
						}, session.date) : /* @__PURE__ */ jsx("p", {
							className: "text-sm text-muted-foreground",
							children: t("Ο έλεγχος ανοίγει μόνο την ημέρα της συνεδρίας. Η ιστορική ή μελλοντική προβολή δεν δίνει άδεια εκτέλεσης.")
						})] }),
						/* @__PURE__ */ jsxs("div", {
							className: "border-t pt-5",
							children: [/* @__PURE__ */ jsx("h3", {
								className: "font-semibold",
								children: t("Επίβλεψη δύναμης")
							}), /* @__PURE__ */ jsxs("label", {
								className: "mt-3 flex items-start gap-2 text-sm",
								children: [/* @__PURE__ */ jsx("input", {
									type: "checkbox",
									checked: settings.coachSupervised,
									onChange: (e) => saveTrainingSettings(profile.id, { coachSupervised: e.target.checked }, profile),
									className: "mt-1"
								}), t("Παρίσταται καταρτισμένος προπονητής και ελέγχει τεχνική και δόση.")]
							})]
						}),
						/* @__PURE__ */ jsxs("details", {
							className: "border-t pt-5",
							children: [/* @__PURE__ */ jsx("summary", {
								className: "font-semibold",
								children: t("Ώρα & διάρκεια")
							}), /* @__PURE__ */ jsxs("form", {
								className: "mt-4 space-y-3",
								onSubmit: (e) => {
									e.preventDefault();
									const data = new FormData(e.currentTarget);
									const key = [
										"mon",
										"wed",
										"fri"
									][selected];
									saveTrainingSettings(profile.id, {
										[`supplement${key}Time`]: data.get("time"),
										[`supplement${key}Minutes`]: Number(data.get("minutes"))
									}, profile);
								},
								children: [
									/* @__PURE__ */ jsxs("label", {
										className: "block text-sm",
										children: [t("Έναρξη"), /* @__PURE__ */ jsx(Input, {
											type: "time",
											name: "time",
											required: true,
											defaultValue: session.start,
											className: "mt-1"
										})]
									}),
									/* @__PURE__ */ jsxs("label", {
										className: "block text-sm",
										children: [t("Παράθυρο (40–60′)"), /* @__PURE__ */ jsx(Input, {
											type: "number",
											name: "minutes",
											min: "40",
											max: "60",
											required: true,
											defaultValue: session.minutes,
											className: "mt-1"
										})]
									}),
									/* @__PURE__ */ jsxs(Button, {
										type: "submit",
										variant: "outline",
										children: [
											/* @__PURE__ */ jsx(Check, {}),
											" ",
											t("Αποθήκευση")
										]
									})
								]
							}, session.id)]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs leading-relaxed text-muted-foreground",
							children: t("Οι έλεγχοι 9 ωρών μεταξύ υποχρεώσεων, τα περιθώρια σχολείου/ομάδας και τα όρια φόρτου είναι συντηρητικοί κανόνες του αρχικού προγράμματος — όχι κλινικά επικυρωμένο μοντέλο πρόβλεψης τραυματισμού.")
						})
					]
				})]
			})] }),
			/* @__PURE__ */ jsxs("section", {
				className: "border-t pt-6",
				children: [
					/* @__PURE__ */ jsxs("h2", {
						className: "flex items-center gap-2 text-xl font-semibold",
						children: [
							/* @__PURE__ */ jsx(ShieldCheck, { className: "size-5 text-training" }),
							" ",
							t("Τεκμηρίωση, όχι υποσχέσεις")
						]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-3 text-sm leading-relaxed text-muted-foreground",
						children: t("Επαναφέραμε το αρχικό πρόγραμμα από την έκδοση 18.1.2. Δεν αποτελεί εξατομικευμένη συνταγή ή εγγύηση αποτελέσματος. Η πρόοδος και η επιβάρυνση αποφασίζονται μαζί με τον προπονητή της ομάδας.")
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-4 grid gap-4 sm:grid-cols-2",
						children: TRAINING_EVIDENCE.map((source) => /* @__PURE__ */ jsxs("div", {
							className: "border-b py-4",
							children: [
								/* @__PURE__ */ jsxs("a", {
									className: "inline-flex items-start gap-2 font-medium text-training underline-offset-4 hover:underline",
									href: source.url,
									target: "_blank",
									rel: "noopener noreferrer",
									children: [t(source.name), /* @__PURE__ */ jsx(ExternalLink, { className: "mt-1 size-3 shrink-0" })]
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-2 text-sm",
									children: t(source.claim)
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-2 text-xs text-muted-foreground",
									children: t(source.checked)
								})
							]
						}, source.url))
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-4 text-xs text-muted-foreground",
						children: t("14 σύνδεσμοι YouTube: τίτλος, κανάλι και διαθεσιμότητα επανελέγχθηκαν 15/11/2026. Δεν έγινε πλήρης ανεξάρτητος έλεγχος κάθε βίντεο. Η διαθεσιμότητα μπορεί να αλλάξει. Χωρίς ενσωμάτωση βίντεο ή αυτόματη αναπαραγωγή.")
					})
				]
			}),
			coach && session && /* @__PURE__ */ jsx(SessionCoach, {
				session,
				allowed: canExecute,
				basketballFocus: settings.basketballSkillFocus,
				basketballNote: settings.basketballCoachNote,
				onClose: () => setCoach(false),
				onComplete: (minutes) => completed(true, minutes)
			})
		]
	});
}
function PlayIcon() {
	const { t, pick, language } = useI18n();
	return /* @__PURE__ */ jsx(Timer, { className: "size-4" });
}
//#endregion
export { Training as component };
