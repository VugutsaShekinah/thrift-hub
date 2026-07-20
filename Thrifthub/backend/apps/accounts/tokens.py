from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class ThriftHubTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Embeds role/staff flags in the access token payload so the frontend
    can make quick UI decisions (e.g. show admin nav) without an extra
    round-trip, while the server still re-checks permissions on every
    request rather than trusting the token contents."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["is_staff"] = user.is_staff
        token["full_name"] = user.full_name
        return token
