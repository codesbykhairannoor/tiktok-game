const EventSource = require('eventsource');

class SaweriaListener {
    constructor(streamKey, aiBrain, io) {
        this.streamKey = streamKey;
        this.aiBrain = aiBrain;
        this.io = io;
        this.es = null;
        this.isConnected = false;

        if (this.streamKey) {
            this.connect(this.streamKey);
        }
    }

    connect(streamKey) {
        if (!streamKey) return;
        this.streamKey = streamKey;

        if (this.es) {
            try { this.es.close(); } catch (e) {}
        }

        const url = `https://saweria.co/overlay/stream?streamKey=${this.streamKey}`;
        console.log(`[SAWERIA] 🔄 Menghubungkan ke stream overlay Saweria...`);

        try {
            this.es = new EventSource(url);

            this.es.onopen = () => {
                this.isConnected = true;
                console.log(`[SAWERIA] ✅ Terhubung ke Saweria Stream!`);
                this.io.emit('SAWERIA_STATUS', { connected: true });
            };

            this.es.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (!data) return;

                    const donator = data.donator || data.name || 'Sultan Misterius';
                    const amount = Number(data.amount || 0);
                    const message = data.message || '';

                    console.log(`[SAWERIA 💰] ${donator} donasi Rp ${amount.toLocaleString('id-ID')}: "${message}"`);

                    // Kirim ke overlay OBS
                    this.io.emit('SAWERIA_ALERT', {
                        donator,
                        amount,
                        message
                    });

                    // Masukkan ke antrean prioritas AI Brain
                    this.aiBrain.enqueue({
                        type: 'saweria',
                        sender: donator,
                        amount: amount,
                        message: message
                    });
                } catch (err) {
                    console.error('[SAWERIA] Error parsing event:', err.message);
                }
            };

            this.es.onerror = (err) => {
                this.isConnected = false;
                console.warn('[SAWERIA] ⚠️ Koneksi terputus atau streamKey belum valid.');
                this.io.emit('SAWERIA_STATUS', { connected: false });
            };
        } catch (err) {
            console.error('[SAWERIA] Error connecting to EventSource:', err);
        }
    }

    disconnect() {
        if (this.es) {
            try { this.es.close(); } catch (e) {}
            this.isConnected = false;
        }
    }
}

module.exports = SaweriaListener;
