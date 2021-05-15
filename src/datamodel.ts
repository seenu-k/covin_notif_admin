/* eslint-disable @typescript-eslint/naming-convention */

export type FeeType = "Free" | "Paid";
export type Vaccine = "COVISHIELD" | "COVAXIN";
export type MinAgeLimit = 18 | 45;

export interface VaccineFee {
    vaccine: Vaccine;
    fee: string;
}

export interface Center {
    center_id: number;
    name: string;
    address?: string;
    state_name: string;
    district_name: string;
    block_name: string;
    pincode: number;
    lat?: number;
    long?: number;
    from: string;
    to: string;
    fee_type: FeeType;
    vaccine_fees?: VaccineFee[];
    sessions: Session[];
}

export interface Session {
    session_id: string;
    date: string;
    available_capacity: number;
    available_capacity_dose1?: number;
    available_capacity_dose2?: number;
    min_age_limit: MinAgeLimit;
    vaccine: Vaccine;
    slots: string[];
}