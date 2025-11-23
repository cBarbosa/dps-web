export type SalesChannel = {
	uid: string
	name: string
	description?: string | null
	active: boolean
}

export type UserDataWithChannels = {
	uid: string
	name: string
	email: string
	role: string
	status: string
	lastChannel: SalesChannel | null
	channels: SalesChannel[]
	company?: {
		uid: string
		name: string
	}
}

export type AuthResponse = {
	message: string
	success: boolean
	data: {
		accessToken: string
		expires: string
		role: string
		userData: UserDataWithChannels
	}
}

export type ChangeChannelRequest = {
	salesChannelUid: string
}

export type ChangeChannelResponse = {
	message: string
	success: boolean
	data: {
		accessToken: string
		expires: string
		role: string
		userData: UserDataWithChannels
	} | null
}

