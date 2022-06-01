/**
 * Wrapper on DataView that has a "cursor" tracking the current read location.
 */
export class DataReader {
    // --------------------------------------------------------------------- //
    // Construction
    // --------------------------------------------------------------------- //

    constructor(arrayBuffer) {
        this._view = new DataView(arrayBuffer);
        this._offset = 0;
    }

    // --------------------------------------------------------------------- //
    // Properties
    // --------------------------------------------------------------------- //

    get offset() {
        return this._offset;
    }

    // --------------------------------------------------------------------- //
    // Offseting
    // --------------------------------------------------------------------- //

    skip(n) {
        this._offset += n;
    }
    seek(offset) {
        this._offset = offset;
    }

    // --------------------------------------------------------------------- //
    // Read
    // --------------------------------------------------------------------- //

    readCharString(len) {
        let s = '';
        while (len > 0) {
            const c = this.readUint8();
            s += String.fromCharCode(c);
            len--;
        }
        return s;
    }

    readUint8() {
        const v = this._view.getUint8(this._offset);
        this._offset += 1;
        return v;
    }

    readUint16LE() {
        throw new Error('NOT YET IMPLEMENTED');
    }

    readUint32LE() {
        const v = this._view.getUint32(this._offset, true);
        this._offset += 4;
        return v;
    }

    readInt8() {
        throw new Error('NOT YET IMPLEMENTED');
    }

    readInt16LE() {
        throw new Error('NOT YET IMPLEMENTED');
    }

    readInt32LE() {
        const v = this._view.getInt32(this._offset, true);
        this._offset += 4;
        return v;
    }

    // --------------------------------------------------------------------- //
    // Peek
    // --------------------------------------------------------------------- //

    peekUint8() {
        return this._view.getUint8(this._offset);
    }
}
