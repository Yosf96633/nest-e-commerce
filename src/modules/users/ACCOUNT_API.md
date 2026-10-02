# Account management API

All endpoints require `Authorization: Bearer <accessToken>`.

| Method   | Endpoint                  | Purpose                                                                   |
| -------- | ------------------------- | ------------------------------------------------------------------------- |
| `GET`    | `/users/me`               | Get the signed-in user's profile and roles                                |
| `PATCH`  | `/users/me`               | Update profile fields; send multipart form data to include `profileImage` |
| `DELETE` | `/users/me/profile-image` | Remove the profile image                                                  |
| `PATCH`  | `/users/me/password`      | Change password and revoke all refresh-token sessions                     |
| `GET`    | `/users/me/sessions`      | List active sessions without exposing refresh-token hashes                |
| `DELETE` | `/users/me/sessions/:id`  | Revoke one of the signed-in user's sessions                               |
| `DELETE` | `/users/me/sessions`      | Revoke every session and clear the refresh-token cookie                   |
| `DELETE` | `/users/me`               | Permanently delete the account after password confirmation                |

`PATCH /users/profile` remains as a compatibility route for profile updates.

## Request examples

Change password:

```json
{
  "currentPassword": "CurrentPass123!",
  "newPassword": "NewPass456!"
}
```

Delete the account:

```json
{
  "password": "CurrentPass123!"
}
```

Account deletion cascades through the user's database records, including owned
stores and products, and attempts to delete their profile, store, and product
images from Cloudinary.

Login and refresh now record the request's user-agent and IP address on each
session. Older sessions can have those values set to `null`.
