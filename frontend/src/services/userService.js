import api from './api'

export const userService = {
  getProfile: async (userId) => {
    const response = await api.get(`/api/users/${userId}`)
    return response.data
  },

  updateProfile: async (userId, data) => {
    const response = await api.put(`/api/users/${userId}`, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  },

  getCourses: async (userId) => {
    const response = await api.get(`/api/users/${userId}/courses`)
    return response.data
  },

  enrollCourse: async (courseId) => {
    const response = await api.post(`/api/users/courses/${courseId}/enroll`)
    return response.data
  },

  getReputation: async (userId) => {
    const response = await api.get(`/api/users/${userId}/reputation`)
    return response.data
  },

  getActivityFeed: async (userId) => {
    const response = await api.get(`/api/users/${userId}/activity`)
    return response.data
  },

  getFriends: async (userId) => {
    const id = userId === 'me' ? 'me' : userId
    const response = await api.get(`/api/users/${id}/friends`)
    return response.data
  },

  follow: async (targetId) => {
    const response = await api.post(`/api/users/${targetId}/follow`)
    return response.data
  },

  unfollow: async (targetId) => {
    const response = await api.delete(`/api/users/${targetId}/follow`)
    return response.data
  },

  isFollowing: async (targetId) => {
    const response = await api.get(`/api/users/${targetId}/following`)
    return response.data.following
  }
}
