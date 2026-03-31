import * as SecureStore from 'expo-secure-store'

export const saveToken = async (token : string) => {
    await SecureStore.setItem("token", token)
}
export const getToken = async () => {
    await SecureStore.getItem("token")
}
export const deleteToken = async () => {
    await SecureStore.deleteItemAsync("token")
}
