const axios =
    require('axios');

async function getAccessToken() {

    const response =
        await axios.post(

            `${process.env.SF_LOGIN_URL}/services/oauth2/token`,

            null,

            {
                params: {

                    grant_type:
                        process.env.SF_GRANT_TYPE,

                    client_id:
                        process.env.SF_CLIENT_ID,

                    client_secret:
                        process.env.SF_CLIENT_SECRET

                }
            }

        );

    return response.data;

}

module.exports = {
    getAccessToken
};