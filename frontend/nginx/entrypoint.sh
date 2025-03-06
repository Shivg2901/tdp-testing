if [[ -z $AUTH_MAP ]]; then
    echo "AUTH_MAP is not set. Exiting..."
    exit 1
fi

> /etc/nginx/.htpasswd
IFS=',' read -ra PAIRS <<< $AUTH_MAP
for pair in "${PAIRS[@]}"; do
    IFS='=' read -r user password <<< $pair
    htpasswd -bB /etc/nginx/.htpasswd $user $password
done
echo "Updated .htpasswd file"

nginx -g "daemon off;"