# Stalwart Mail Server for Olares

Modern all-in-one email server with IMAP, JMAP, and SMTP support.

## Features

- **Full Email Protocol Support**: IMAP4rev2, JMAP, SMTP
- **Web Administration**: Easy-to-use admin interface
- **Security**: TLS/SSL encryption, spam filtering
- **Modern Architecture**: Built with Rust for performance and safety

## Installation

Install from the Olares Market or upload this chart to DevBox.

## Configuration

After installation:

1. Access the admin interface from Olares Desktop
2. Change the default password (current: `changeme123`)
3. Configure your email domain
4. Set up DNS records (MX, SPF, DKIM, DMARC)

## DNS Configuration

For domain `example.com`:

```dns
example.com.           IN  MX  10 mail.example.com.
mail.example.com.      IN  A   YOUR_SERVER_IP
example.com.           IN  TXT "v=spf1 mx ~all"
_dmarc.example.com.    IN  TXT "v=DMARC1; p=quarantine"
```

## Resources

- Website: https://stalw.art
- Documentation: https://stalw.art/docs
- Source Code: https://github.com/stalwartlabs/stalwart

## License

See the [official Stalwart repository](https://github.com/stalwartlabs/stalwart) for license information.
