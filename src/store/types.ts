import type { StateCreator } from 'zustand'
import type { CaptureSlice } from './capture-slice'
import type { FilterSlice } from './filter-slice'
import type { SelectionSlice } from './selection-slice'
import type { UiSlice } from './ui-slice'

export type AppState = CaptureSlice & FilterSlice & SelectionSlice & UiSlice

export type SliceCreator<T> = StateCreator<AppState, [['zustand/persist', unknown]], [], T>
