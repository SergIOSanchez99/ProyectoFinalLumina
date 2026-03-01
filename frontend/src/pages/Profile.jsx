import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { userService } from '../services/userService'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import './Profile.css'

function Profile() {
  const { userId } = useParams()
  const { user: currentUser, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [reputation, setReputation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const fileInputRef = useRef(null)

  const isOwnProfile = !userId || userId === currentUser.id

  useEffect(() => {
    loadProfile()
  }, [userId])

  useEffect(() => {
    if (profile && !isOwnProfile) {
      userService.isFollowing(profile.id).then(setIsFollowing)
    }
  }, [profile?.id, isOwnProfile])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const targetUserId = userId || currentUser.id
      const [profileData, reputationData] = await Promise.all([
        userService.getProfile(targetUserId),
        userService.getReputation(targetUserId)
      ])
      setProfile(profileData)
      setReputation(reputationData)
      setAvatarPreview(profileData?.avatar_url ?? null)
    } catch (error) {
      toast.error('Error al cargar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 2 MB')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato no válido. Usa JPG, PNG, GIF o WebP')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setAvatarPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleFollow = async () => {
    try {
      await userService.follow(profile.id)
      setIsFollowing(true)
      toast.success('Ahora sigues a este usuario')
    } catch (error) {
      if (error.response?.status === 409) {
        setIsFollowing(true)
      }
      toast.error(error.response?.data?.error || 'Error al seguir')
    }
  }

  const handleUnfollow = async () => {
    try {
      await userService.unfollow(profile.id)
      setIsFollowing(false)
      toast.success('Dejaste de seguir')
    } catch {
      toast.error('Error al dejar de seguir')
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    const form = e.target
    const formData = {
      name: form.name.value,
      university: form.university.value,
      career: form.career.value,
      bio: form.bio.value,
      nickname: form.nickname.value || null
    }

    formData.avatar_url = (avatarPreview && avatarPreview.startsWith('data:image')) ? avatarPreview : null

    try {
      await userService.updateProfile(currentUser.id, formData)
      updateUser({ avatar_url: formData.avatar_url, nickname: formData.nickname })
      toast.success('Perfil actualizado')
      setIsEditing(false)
      loadProfile()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar perfil')
    }
  }

  if (loading) {
    return <div className="loading-spinner">Cargando perfil...</div>
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="profile-avatar-img" />
            ) : (
              profile?.name?.charAt(0).toUpperCase()
            )}
          </div>
        </div>
        <div className="profile-info">
          <h1>{profile?.name}</h1>
          {profile?.nickname && (
            <p className="profile-nickname">@{profile.nickname}</p>
          )}
          <p className="profile-university">{profile?.university}</p>
          <p className="profile-career">{profile?.career}</p>
        </div>
        {isOwnProfile ? (
          <button 
            className="btn btn-outline"
            onClick={() => {
              if (isEditing) setAvatarPreview(profile?.avatar_url ?? null)
              setIsEditing(!isEditing)
            }}
          >
            {isEditing ? 'Cancelar' : 'Editar Perfil'}
          </button>
        ) : (
          <button
            className={`btn ${isFollowing ? 'btn-outline' : 'btn-primary'}`}
            onClick={isFollowing ? handleUnfollow : handleFollow}
          >
            {isFollowing ? 'Siguiendo' : 'Agregar amigo'}
          </button>
        )}
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <h3>{reputation?.points || 0}</h3>
          <p>Puntos</p>
        </div>
        <div className="stat-card">
          <h3>{reputation?.level || 1}</h3>
          <p>Nivel</p>
        </div>
        <div className="stat-card">
          <h3>{reputation?.rank || 'N/A'}</h3>
          <p>Ranking</p>
        </div>
        <div className="stat-card">
          <h3>{profile?.contributionsCount || 0}</h3>
          <p>Contribuciones</p>
        </div>
      </div>

      {isEditing && (
        <div className="profile-edit-form card">
          <h2>Editar Perfil</h2>
          <form onSubmit={handleSaveProfile}>
            <div className="form-group profile-avatar-upload">
              <label className="form-label">Foto de perfil</label>
              <div className="avatar-upload-area">
                <div className="avatar-preview">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Vista previa" />
                  ) : (
                    <span>{profile?.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="avatar-upload-actions">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarChange}
                    className="avatar-file-input"
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Subir imagen
                  </button>
                  {avatarPreview && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setAvatarPreview(null)}
                    >
                      Quitar
                    </button>
                  )}
                  <p className="avatar-hint">JPG, PNG, GIF o WebP. Máx. 2 MB</p>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                name="name"
                className="form-input"
                defaultValue={profile?.name}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nickname</label>
              <input
                type="text"
                name="nickname"
                className="form-input"
                defaultValue={profile?.nickname}
                placeholder="tu_nickname"
                maxLength={50}
              />
              <span className="form-hint">Nombre visible en la comunidad (ej: @tu_nickname)</span>
            </div>

            <div className="form-group">
              <label className="form-label">Universidad</label>
              <input
                type="text"
                name="university"
                className="form-input"
                defaultValue={profile?.university}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Carrera</label>
              <input
                type="text"
                name="career"
                className="form-input"
                defaultValue={profile?.career}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea
                name="bio"
                className="form-textarea"
                defaultValue={profile?.bio}
                placeholder="Cuéntanos sobre ti..."
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Guardar Cambios
            </button>
          </form>
        </div>
      )}

      <div className="profile-activity">
        <h2>Actividad Reciente</h2>
        <div className="empty-state">
          <p>No hay actividad reciente</p>
        </div>
      </div>
    </div>
  )
}

export default Profile
